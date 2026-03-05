const Database = require("../config/db");
const db = Database.getInstance().getClient();
const Cita = require("../models/cita.model");

// helper: convierte fecha+hora a objeto Date
function fechaHoraDate(fecha, hora) {
  return new Date(`${fecha}T${hora}`);
}

// helper: verifica si faltan X minutos para la cita
function minutosHastaLaCita(fecha, hora) {
  const ahora = new Date();
  const citaDate = fechaHoraDate(fecha, hora);
  return (citaDate - ahora) / 60000; // en minutos
}

// ==================================================
// OBTENER CITAS
// ==================================================
exports.obtenerCitas = async (req, res) => {
  try {
    if (!req.usuario?.id_empresa)
      return res.status(401).json({ error: "Usuario no autenticado" });

    const { data, error } = await db
      .from("citas")
      .select("*")
      .eq("id_empresa", req.usuario.id_empresa)
      .order("fecha", { ascending: true })
      .order("hora_inicio", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    res.json(data.map(c => Cita(c)));
  } catch (err) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ==================================================
// CREAR CITA — valida conflicto de horario
// ==================================================
exports.crearCita = async (req, res) => {
  try {
    if (!req.usuario?.id_empresa)
      return res.status(401).json({ error: "Usuario no autenticado" });

    const {
      id_cliente, titulo, fecha, hora_inicio, hora_final,
      nombre_cliente, numero_cliente, motivo, color
    } = req.body;

    if (!id_cliente || !titulo || !fecha || !hora_inicio || !hora_final)
      return res.status(400).json({ error: "Datos incompletos" });

    // Verificar conflicto de horario para el mismo encargado y fecha
    const { data: citasExistentes, error: errorBusqueda } = await db
      .from("citas")
      .select("*")
      .eq("id_empresa", req.usuario.id_empresa)
      .eq("id_cliente", id_cliente)
      .eq("fecha", fecha);

    if (errorBusqueda) return res.status(500).json({ error: errorBusqueda.message });

    const hayConflicto = citasExistentes.some(c => {
      return hora_inicio < c.hora_final && hora_final > c.hora_inicio;
    });

    if (hayConflicto) {
      return res.status(409).json({
        error: "El encargado ya tiene una cita en ese horario"
      });
    }

    const { data, error } = await db
      .from("citas")
      .insert({
        id_empresa: req.usuario.id_empresa,
        id_cliente, titulo, fecha, hora_inicio, hora_final,
        nombre_cliente, numero_cliente, motivo, color
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    res.status(201).json(Cita(data));
  } catch (err) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ==================================================
// ACTUALIZAR CITA — solo 3 horas antes
// ==================================================
exports.actualizarCita = async (req, res) => {
  try {
    if (!req.usuario?.id_empresa)
      return res.status(401).json({ error: "Usuario no autenticado" });

    // Obtener cita actual
    const { data: citaActual, error: errorBuscar } = await db
      .from("citas")
      .select("*")
      .eq("id_cita", req.params.id)
      .eq("id_empresa", req.usuario.id_empresa)
      .single();

    if (errorBuscar || !citaActual)
      return res.status(404).json({ error: "Cita no encontrada" });

    // Validar 3 horas antes
    const minutosRestantes = minutosHastaLaCita(citaActual.fecha, citaActual.hora_inicio);
    if (minutosRestantes < 180) {
      return res.status(403).json({
        error: "Solo puedes editar la cita con al menos 3 horas de anticipación"
      });
    }

    const { data, error } = await db
      .from("citas")
      .update(req.body)
      .eq("id_cita", req.params.id)
      .eq("id_empresa", req.usuario.id_empresa)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    res.json(Cita(data));
  } catch (err) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// ==================================================
// ELIMINAR CITA — solo 30 min antes
// ==================================================
exports.eliminarCita = async (req, res) => {
  try {
    if (!req.usuario?.id_empresa)
      return res.status(401).json({ error: "Usuario no autenticado" });

    // Obtener cita actual
    const { data: citaActual, error: errorBuscar } = await db
      .from("citas")
      .select("*")
      .eq("id_cita", req.params.id)
      .eq("id_empresa", req.usuario.id_empresa)
      .single();

    if (errorBuscar || !citaActual)
      return res.status(404).json({ error: "Cita no encontrada" });

    // Validar 30 minutos antes
    const minutosRestantes = minutosHastaLaCita(citaActual.fecha, citaActual.hora_inicio);
    if (minutosRestantes < 30) {
      return res.status(403).json({
        error: "Solo puedes cancelar la cita con al menos 30 minutos de anticipación"
      });
    }

    const { error } = await db
      .from("citas")
      .delete()
      .eq("id_cita", req.params.id)
      .eq("id_empresa", req.usuario.id_empresa);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ message: "Cita eliminada correctamente" });
  } catch (err) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};