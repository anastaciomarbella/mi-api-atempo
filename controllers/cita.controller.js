// controllers/cita.controller.js
const Database = require('../config/db');
const db = Database.getInstance();
const Cita = require('../models/cita.model');

const generarId = () => Math.floor(Math.random() * 1000000);

// Función para convertir hora AM/PM a 24h de manera segura
function convertirHoraAmPmA24h(horaAmPm) {
  if (!horaAmPm || typeof horaAmPm !== 'string') return null;

  const partes = horaAmPm.trim().split(' ');
  if (partes.length !== 2) return null;

  const [time, modifier] = partes;
  const [hoursStr, minutesStr] = time.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  if (isNaN(hours) || isNaN(minutes)) return null;

  if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
  if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
}

// =============================
// Obtener todas las citas
exports.obtenerCitas = async (req, res) => {
  try {
    const { data, error } = await db.from('citas').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data.map(Cita));
  } catch (err) {
    console.error('Error obtenerCitas:', err);
    res.status(500).json({ error: 'Error interno en el servidor' });
  }
};

// =============================
// Obtener cita por ID
exports.obtenerCitaPorId = async (req, res) => {
  try {
    const { data, error } = await db
      .from('citas')
      .select('*')
      .eq('id_cita', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ message: 'Cita no encontrada' });
    res.json(Cita(data));
  } catch (err) {
    console.error('Error obtenerCitaPorId:', err);
    res.status(500).json({ error: 'Error interno en el servidor' });
  }
};

// =============================
// Obtener citas por persona
exports.obtenerCitaPorIdPersona = async (req, res) => {
  try {
    const { data, error } = await db
      .from('citas')
      .select('*')
      .eq('id_persona', req.params.id_persona);

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    console.error('Error obtenerCitaPorIdPersona:', err);
    res.status(500).json({ error: 'Error interno en el servidor' });
  }
};

// =============================
// Crear cita
exports.crearCita = async (req, res) => {
  try {
    const { id_persona, fecha, hora_inicio, hora_final } = req.body;

    if (!id_persona || !fecha || !hora_inicio || !hora_final) {
      return res.status(400).json({ error: 'Faltan datos obligatorios para crear la cita' });
    }

    const cita = {
      id_cita: generarId(),
      ...req.body,
      hora_inicio: convertirHoraAmPmA24h(hora_inicio),
      hora_final: convertirHoraAmPmA24h(hora_final),
    };

    const { data, error } = await db.from('citas').insert([cita]).select();
    if (error) return res.status(500).json({ error: error.message });

    res.status(201).json({ message: 'Cita creada', cita: data[0] });
  } catch (err) {
    console.error('Error crearCita:', err);
    res.status(500).json({ error: 'Error interno en el servidor' });
  }
};

// =============================
// Actualizar cita
exports.actualizarCita = async (req, res) => {
  try {
    const cambios = {};

    // Actualiza solo los campos que se envían
    if (req.body.titulo !== undefined) cambios.titulo = req.body.titulo;
    if (req.body.descripcion !== undefined) cambios.descripcion = req.body.descripcion;
    if (req.body.fecha !== undefined) cambios.fecha = req.body.fecha;
    if (req.body.hora_inicio !== undefined) cambios.hora_inicio = convertirHoraAmPmA24h(req.body.hora_inicio);
    if (req.body.hora_final !== undefined) cambios.hora_final = convertirHoraAmPmA24h(req.body.hora_final);
    if (req.body.id_persona !== undefined) cambios.id_persona = req.body.id_persona;
    if (req.body.color !== undefined) cambios.color = req.body.color;

    const { data, error } = await db.from('citas').update(cambios).eq('id_cita', req.params.id).select();
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: 'Cita no encontrada' });

    res.json({ message: 'Cita actualizada', cita: data[0] });
  } catch (err) {
    console.error('Error actualizarCita:', err);
    res.status(500).json({ error: 'Error interno en el servidor' });
  }
};

// =============================
// Eliminar cita
exports.eliminarCita = async (req, res) => {
  try {
    const { error } = await db.from('citas').delete().eq('id_cita', req.params.id);
    if (error) return res.status(500).json({ error: error.message });

    res.json({ message: 'Cita eliminada' });
  } catch (err) {
    console.error('Error eliminarCita:', err);
    res.status(500).json({ error: 'Error interno en el servidor' });
  }
};
