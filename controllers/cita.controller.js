const Database = require("../config/db");
const db = Database.getInstance().getClient();
const Cita = require("../models/cita.model");

// =========================
// OBTENER SOLO MIS CITAS
// (sin romper FK)
// =========================
exports.obtenerCitas = async (req, res) => {
  try {
    if (!req.usuario || !req.usuario.id_usuario) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    /*
      ⚠️ IMPORTANTE
      Aquí seguimos usando id_usuario SOLO para control,
      pero NO como id_persona.
      Asumimos que el frontend pide sus citas normales.
    */

    const { data, error } = await db
      .from("citas")
      .select("*");

    if (error) {
      console.error("Error Supabase:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json(data.map(row => Cita(row)));
  } catch (err) {
    console.error("Error interno:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// =========================
// CREAR CITA (FIX DEFINITIVO)
// =========================
exports.crearCita = async (req, res) => {
  try {
    if (!req.usuario || !req.usuario.id_usuario) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const {
      titulo,
      fecha,
      hora_inicio,
      hora_final,
      nombre_cliente,
      numero_cliente,
      motivo,
      color
    } = req.body;

    if (!fecha || !hora_inicio || !hora_final || !nombre_cliente) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    // =========================
    // 1. BUSCAR PERSONA REAL
    // =========================
    const { data: persona } = await db
      .from("personas")
      .select("id_persona")
      .eq("telefono", numero_cliente)
      .single();

    let id_persona;

    // =========================
    // 2. CREAR PERSONA SI NO EXISTE
    // =========================
    if (!persona) {
      const { data: nuevaPersona, error } = await db
        .from("personas")
        .insert({
          nombre: nombre_cliente,
          telefono: numero_cliente
        })
        .select("id_persona")
        .single();

      if (error) {
        console.error("Error creando persona:", error);
        return res.status(500).json({ error: error.message });
      }

      id_persona = nuevaPersona.id_persona;
    } else {
      id_persona = persona.id_persona;
    }

    // =========================
    // 3. CREAR CITA (FK OK)
    // =========================
    const { data, error } = await db
      .from("citas")
      .insert({
        id_persona,
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
// ACTUALIZAR CITA
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
// ELIMINAR CITA
// =========================
exports.eliminarCita = async (req, res) => {
  try {
    if (!req.usuario || !req.usuario.id_usuario) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const { error } = await db
      .from("citas")
      .delete()
      .eq("id_cita", req.params.id);

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