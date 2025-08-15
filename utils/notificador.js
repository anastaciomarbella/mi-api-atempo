const Database = require('../config/db');
const db = Database.getInstance();
const { sumarTiempo } = require('./utils'); // si ya tienes la función, sino la incluimos abajo

// 🔧 Función para generar avisos usando Supabase
async function generarAvisos() {
  try {
    const ahora = new Date();

    // 1️⃣ Traer citas próximas 24 horas
    const citas = await db.query('citas', 'select', {
      columns: '*',
      filters: [
        { field: 'fecha', operator: 'gte', value: ahora.toISOString() },
        { field: 'fecha', operator: 'lte', value: sumarTiempo(ahora, 1, 'dias').toISOString() },
      ],
    });

    for (const cita of citas) {
      const fechaCita = new Date(cita.fecha);
      const personaId = cita.id_persona;
      const citaId = cita.id_cita;

      // 🔔 Aviso 1 día antes
      const unDiaAntes = sumarTiempo(fechaCita, -1, 'dias');
      if (ahora >= unDiaAntes && ahora < fechaCita) {
        const mensaje = `📅 Recordatorio: Tu cita es mañana (${fechaCita.toLocaleString()})`;
        await crearAvisoSiNoExiste(personaId, citaId, mensaje);
      }

      // ⏰ Aviso 3 horas antes
      const tresHorasAntes = sumarTiempo(fechaCita, -3, 'horas');
      if (ahora >= tresHorasAntes && ahora < fechaCita) {
        const mensaje = `⏰ Recordatorio: Tu cita es en 3 horas (${fechaCita.toLocaleString()})`;
        await crearAvisoSiNoExiste(personaId, citaId, mensaje);
      }
    }

    console.log('✔️ Avisos procesados');
  } catch (err) {
    console.error('❌ Error generando avisos:', err.message);
  }
}

// ✅ Crear aviso si no existe
async function crearAvisoSiNoExiste(personaId, citaId, mensajeBase) {
  // Verificar si ya existe el aviso
  const avisosExistentes = await db.query('avisos', 'select', {
    columns: '*',
    filters: [
      { field: 'id_persona', operator: 'eq', value: personaId },
      { field: 'id_cita', operator: 'eq', value: citaId },
      { field: 'mensaje', operator: 'eq', value: mensajeBase },
    ],
  });

  if (avisosExistentes.length > 0) return;

  // Obtener teléfono de la persona
  const personas = await db.query('personas', 'select', {
    columns: 'telefono',
    filters: [{ field: 'id_persona', operator: 'eq', value: personaId }],
  });

  const telefono = personas[0]?.telefono || 'N/A';
  const mensajeFinal = `${mensajeBase} | WhatsApp: ${telefono}`;
  const idAviso = Math.floor(Math.random() * 1000000);

  // Insertar aviso
  await db.query('avisos', 'insert', {
    data: {
      id_aviso: idAviso,
      id_persona: personaId,
      id_cita: citaId,
      mensaje: mensajeFinal,
      fecha_aviso: new Date().toISOString(),
    },
  });

  console.log(`✅ Aviso creado para persona ${personaId}: "${mensajeFinal}"`);
}

// 🔧 Función auxiliar para sumar tiempo
function sumarTiempo(fecha, cantidad, unidad) {
  const msPorUnidad = {
    horas: 1000 * 60 * 60,
    dias: 1000 * 60 * 60 * 24,
  };
  return new Date(fecha.getTime() + cantidad * msPorUnidad[unidad]);
}

module.exports = { generarAvisos };
