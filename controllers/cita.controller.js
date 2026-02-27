const Database = require("../config/db");
const db = Database.getInstance().getClient();
const Cita = require("../models/cita.model");

// ==================================================
// OBTENER CITAS (POR USUARIO + EMPRESA)
// ==================================================
exports.obtenerCitas = async (req, res) => {
  try {
    if (
      !req.usuario ||
      !req.usuario.id_usuario ||
      !req.usuario.id_empresa
    ) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const { id_usuario, id_empresa } = req.usuario;

    const { data, error } = await db
      .from("citas")
      .select("*")
      .eq("id_usuario", id_usuario)
      .eq("id_empresa", id_empresa)
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

// ==================================================
// CREAR CITA (EMPRESA AUTOMÁTICA)
// ==================================================
exports.crearCita = async (req, res) => {
  try {
    if (
      !req.usuario ||
      !req.usuario.id_usuario ||
      !req.usuario.id_empresa
    ) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const {
      id_cliente,
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
        id_usuario: req.usuario.id_usuario,
        id_empresa: req.usuario.id_empresa, // 🔐 CLAVE
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

// ==================================================
// ACTUALIZAR CITA (PROTEGIDA POR EMPRESA)
// ==================================================
exports.actualizarCita = async (req, res) => {
  try {
    if (
      !req.usuario ||
      !req.usuario.id_usuario ||
      !req.usuario.id_empresa
    ) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const { data, error } = await db
      .from("citas")
      .update(req.body)
      .eq("id_cita", req.params.id)
      .eq("id_usuario", req.usuario.id_usuario)
      .eq("id_empresa", req.usuario.id_empresa)
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

// ==================================================
// ELIMINAR CITA (PROTEGIDA POR EMPRESA)
// ==================================================
exports.eliminarCita = async (req, res) => {
  try {
    if (
      !req.usuario ||
      !req.usuario.id_usuario ||
      !req.usuario.id_empresa
    ) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const { error } = await db
      .from("citas")
      .delete()
      .eq("id_cita", req.params.id)
      .eq("id_usuario", req.usuario.id_usuario)
      .eq("id_empresa", req.usuario.id_empresa);

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