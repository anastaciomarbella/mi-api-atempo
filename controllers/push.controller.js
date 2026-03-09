const express = require("express");
const webpush = require("web-push");
const router = express.Router();

// ── Configurar VAPID ──
webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// ── Almacén en memoria (reemplaza con tu DB en producción) ──
// Estructura: { userId: [subscription, ...] }
const suscripciones = new Map();

/* ─────────────────────────────────────────
   Helper: obtener userId desde tu JWT/sesión
   Ajusta según cómo manejes auth en tu app
───────────────────────────────────────── */
function getUserId(req) {
  // Ejemplo con JWT decodificado por middleware previo:
  return req.user?.id || req.user?.userId || null;
}

/* ─────────────────────────────────────────
   POST /api/push/suscribir
   Guarda la suscripción del navegador
───────────────────────────────────────── */
router.post("/suscribir", (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "No autorizado" });

  const subscription = req.body;
  if (!subscription?.endpoint) {
    return res.status(400).json({ error: "Suscripción inválida" });
  }

  // Guardar (evitar duplicados por endpoint)
  const lista = suscripciones.get(userId) || [];
  const existe = lista.some((s) => s.endpoint === subscription.endpoint);
  if (!existe) {
    lista.push(subscription);
    suscripciones.set(userId, lista);
  }

  res.json({ ok: true });
});

/* ─────────────────────────────────────────
   POST /api/push/desuscribir
   Elimina la suscripción del navegador
───────────────────────────────────────── */
router.post("/desuscribir", (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "No autorizado" });

  const { endpoint } = req.body;
  if (suscripciones.has(userId)) {
    const filtrada = suscripciones.get(userId).filter((s) => s.endpoint !== endpoint);
    suscripciones.set(userId, filtrada);
  }

  res.json({ ok: true });
});

/* ─────────────────────────────────────────
   Función reutilizable: enviar push a un usuario
   Llámala desde cualquier parte de tu backend
   
   Ejemplo de uso:
     const { enviarPush } = require("./push.routes");
     await enviarPush(userId, {
       title: "Nueva cita",
       body: "Juan Pérez agendó una cita para mañana a las 10:00",
       url: "/agenda-diaria",
       tag: "nueva-cita"
     });
───────────────────────────────────────── */
async function enviarPush(userId, payload) {
  const lista = suscripciones.get(String(userId));
  if (!lista || lista.length === 0) return;

  const notificacion = JSON.stringify({
    title: payload.title || "Notificación",
    body: payload.body || "",
    icon: payload.icon || "/logo192.png",
    tag: payload.tag || "general",
    url: payload.url || "/agenda-diaria",
  });

  const promesas = lista.map((sub) =>
    webpush.sendNotification(sub, notificacion).catch((err) => {
      // Si la suscripción expiró (410), eliminarla
      if (err.statusCode === 410) {
        const actualizada = suscripciones
          .get(String(userId))
          ?.filter((s) => s.endpoint !== sub.endpoint);
        suscripciones.set(String(userId), actualizada || []);
      }
    })
  );

  await Promise.allSettled(promesas);
}

/* ─────────────────────────────────────────
   POST /api/push/enviar-prueba
   Endpoint para probar desde Postman/Thunder
───────────────────────────────────────── */
router.post("/enviar-prueba", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "No autorizado" });

  await enviarPush(userId, {
    title: "🔔 Prueba exitosa",
    body: "Las notificaciones push están funcionando correctamente.",
    url: "/agenda-diaria",
    tag: "prueba",
  });

  res.json({ ok: true, mensaje: "Push enviado" });
});

/* ─────────────────────────────────────────
   EJEMPLOS DE INTEGRACIÓN EN TUS RUTAS
   
   // Al crear una cita:
   await enviarPush(empleadoId, {
     title: "📅 Nueva cita agendada",
     body: `${clienteNombre} agendó el ${fecha} a las ${hora}`,
     url: "/agenda-diaria",
     tag: "nueva-cita"
   });

   // Al cancelar una cita:
   await enviarPush(empleadoId, {
     title: "❌ Cita cancelada",
     body: `${clienteNombre} canceló su cita del ${fecha}`,
     url: "/agenda-diaria",
     tag: "cita-cancelada"
   });

   // Recordatorio (ejecutar con cron job, ej: node-cron):
   await enviarPush(empleadoId, {
     title: "⏰ Recordatorio de cita",
     body: `Tienes una cita con ${clienteNombre} en 1 hora`,
     url: "/agenda-diaria",
     tag: "recordatorio"
   });
───────────────────────────────────────── */

module.exports = router;
module.exports.enviarPush = enviarPush;
