// controllers/cita.controller.js
const Database = require('../config/db');
const db = Database.getInstance().getClient();
const { v4: uuidv4 } = require('uuid'); // npm install uuid
const Cita = require('../models/cita.model'); // Usar tu modal

// Función para convertir hora AM/PM a 24h
function convertirHoraAmPmA24h(horaAmPm) {
  if (!horaAmPm) return null;
  const [time, modifier] = horaAmPm.trim().split(' ');
  let [hours, minutes] = time.split(':');
  hours = parseInt(hours, 10);
  if (modifier?.toUpperCase() === 'PM' && hours < 12) hours += 12;
  if (modifier?.toUpperCase() === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${minutes}:00`;
}

// =========================
// OBTENER TODAS LAS CITAS
// =========================
exports.obtenerCitas = async (req, res) => {
  const { data, error } = await db.from('citas').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data.map(row => Cita(row)));
};

// =========================
// OBTENER CITA POR ID
// =========================
exports.obtenerCitaPorId = async (req, res) => {
  const { data, error } = await db
    .from('citas')
    .select('*')
    .eq('id_cita', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0) return res.status(404).json({ error: 'Cita no encontrada' });
  res.json(Cita(data[0]));
};

// =========================
// OBTENER CITAS POR ID_PERSONA
// =========================
exports.obtenerCitaPorIdPersona = async (req, res) => {
  const { data, error } = await db
    .from('citas')
    .select('*')
    .eq('id_persona', req.params.id_persona);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data.map(row => Cita(row)));
};

// =========================
// CREAR CITA
// =========================
exports.crearCita = async (req, res) => {
  try {
    const { id_persona, fecha, hora_inicio, hora_final, nombre_cliente, titulo, motivo, color } = req.body;

    if (!id_persona || !fecha || !hora_inicio || !hora_final) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    const cita = {
      id_cita: uuidv4(),
      id_persona,
      titulo: titulo || null,
      fecha,
      hora_inicio: convertirHoraAmPmA24h(hora_inicio),
      hora_final: convertirHoraAmPmA24h(hora_final),
      nombre_cliente: nombre_cliente || null,
      numero_cliente: numero_cliente || null,
      motivo: titulo || null,
      color: color || null
    };

    const { data, error } = await db.from('citas').insert([cita]).select();
    if (error) return res.status(500).json({ error: `Error al guardar la cita: ${error.message}` });

    res.status(201).json({ message: 'Cita creada', cita: Cita(data[0]) });
  } catch (err) {
    res.status(500).json({ error: 'Error interno en el servidor' });
  }
};

// =========================
// ACTUALIZAR CITA
// =========================
exports.actualizarCita = async (req, res) => {
  try {
    const cambios = {
      ...req.body,
      hora_inicio: req.body.hora_inicio ? convertirHoraAmPmA24h(req.body.hora_inicio) : undefined,
      hora_final: req.body.hora_final ? convertirHoraAmPmA24h(req.body.hora_final) : undefined
    };

    Object.keys(cambios).forEach(key => cambios[key] === undefined && delete cambios[key]);

    const { data, error } = await db
      .from('citas')
      .update(cambios)
      .eq('id_cita', req.params.id)
      .select();

    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: 'Cita no encontrada' });

    res.json({ message: 'Cita actualizada', cita: Cita(data[0]) });
  } catch (err) {
    res.status(500).json({ error: 'Error interno en el servidor' });
  }
};

// =========================
// ELIMINAR CITA
// =========================
exports.eliminarCita = async (req, res) => {
  const { error } = await db.from('citas').delete().eq('id_cita', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Cita eliminada' });
};
