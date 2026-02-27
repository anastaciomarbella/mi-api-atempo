const Database = require("../config/db");
const db = Database.getInstance().getClient();
const Cita = require("../models/cita.model");

// =========================
// OBTENER CITAS (SOLO DEL USUARIO)
// =========================
exports.obtenerCitas = async (req, res) => {
  try {
    if (!req.usuario || !req.usuario.id_usuario) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const { data, error } = await db
      .from("citas")
      .select("*")
      .eq("id_usuario", req.usuario.id_usuario) // 🔐 FILTRO CLAVE
      .order("fecha", { ascending: true })
      .order("hora_inicio", { ascending: true });

    if (error) {
      console.error("Error Supabase:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json(data.map(c => Cita(c)));
  } catch (err) {
    console.error("Error interno:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// =========================
// CREAR CITA
// =========================
exports.crearCita = async (req, res) => {
  try {
    if (!req.usuario || !req.usuario.id_usuario) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const {
      id_cliente,        // 👈 CLIENTE DE LA CITA
      titulo,
      fecha,
      hora_inicio,
      hora_final,
      nombre_cliente,
      numero_cliente,
      motivo,
      color
    } = req.body;

    if (!id_cliente || !titulo || !fecha || !hora_inicio || !hora_final) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    const { data, error } = await db
      .from("citas")
      .insert({
        id_usuario: req.usuario.id_usuario, // 🔐 DUEÑO DE LA CITA
        id_cliente,
        titulo,
        fecha,
        hora_inicio,
        hora_final,
        nombre_cliente,
        numero_cliente,
        motivo,
        color
      })
      .select()
      .single();

    if (error) {
      console.error("Error Supabase:", error);
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json(Cita(data));
  } catch (err) {
    console.error("Error interno:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// =========================
// ACTUALIZAR CITA (SOLO DEL USUARIO)
// =========================
exports.actualizarCita = async (req, res) => {
  try {
    if (!req.usuario || !req.usuario.id_usuario) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const { data, error } = await db
      .from("citas")
      .update(req.body)
      .eq("id_cita", req.params.id)
      .eq("id_usuario", req.usuario.id_usuario) // 🔐 PROTECCIÓN
      .select()
      .single();

    if (error) {
      console.error("Error Supabase:", error);
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    res.json(Cita(data));
  } catch (err) {
    console.error("Error interno:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// =========================
// ELIMINAR CITA (SOLO DEL USUARIO)
// =========================
exports.eliminarCita = async (req, res) => {
  try {
    if (!req.usuario || !req.usuario.id_usuario) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const { error } = await db
      .from("citas")
      .delete()
      .eq("id_cita", req.params.id)
      .eq("id_usuario", req.usuario.id_usuario); // 🔐 PROTECCIÓN

    if (error) {
      console.error("Error Supabase:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: "Cita eliminada correctamente" });
  } catch (err) {
    console.error("Error interno:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};