// controllers/cita.controller.js
const Database = require('../config/db');
const db = Database.getInstance();
const Cita = require('../models/cita.model');

const generarId = () => Math.floor(Math.random() * 1000000);

// Función para convertir hora AM/PM a 24h (solo se usará al crear)
function convertirHoraAmPmA24h(horaAmPm) {
  if (!horaAmPm) return null;
  const [time, modifier] = horaAmPm.trim().split(' ');
  if (!modifier) return horaAmPm; // ya está en 24h
  let [hours, minutes] = time.split(':');
  hours = parseInt(hours, 10);
  if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
  if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${minutes}:00`;
}

// =============================
// Obtener todas las citas
exports.obtenerCitas = async (req, res) => {
  const { data, error } = await db.from('citas').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data.map(Cita));
};

// =============================
// Obtener cita por ID
exports.obtenerCitaPorId = async (req, res) => {
  const { data, error } = await db
    .from('citas')
    .select('*')
    .eq('id_cita', req.params.id)
    .single();

  if (error || !data) return res.status(404).json({ message: 'Cita no encontrada' });
  res.json(Cita(data));
};

// =============================
// Obtener citas por persona
exports.obtenerCitaPorIdPersona = async (req, res) => {
  const { data, error } = await db
    .from('citas')
    .select('*')
    .eq('id_persona', req.params.id_persona);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// =============================
// Crear cita
exports.crearCita = async (req, res) => {
  try {
    if (!req.body.id_persona || !req.body.fecha || !req.body.hora_inicio || !req.body.hora_final) {
      return res.status(400).json({ error: 'Faltan datos obligatorios para crear la cita' });
    }

    const cita = {
      id_cita: generarId(),
      ...req.body,
      hora_inicio: convertirHoraAmPmA24h(req.body.hora_inicio),
      hora_final: convertirHoraAmPmA24h(req.body.hora_final),
    };

    const { data, error } = await db.from('citas').insert([cita]).select();
    if (error) return res.status(500).json({ error: error.message });

    res.status(201).json({ message: 'Cita creada', cita: data[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error interno en el servidor' });
  }
};

// =============================
// Actualizar cita
exports.actualizarCita = async (req, res) => {
  try {
    const cambios = {
      ...req.body, // ya vienen en formato 24h (HH:mm:ss)
    };

    const { data, error } = await db
      .from('citas')
      .update(cambios)
      .eq('id_cita', req.params.id)
      .select();

    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: 'Cita no encontrada' });

    res.json({ message: 'Cita actualizada', cita: data[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error interno en el servidor' });
  }
};

// =============================
// Eliminar cita
exports.eliminarCita = async (req, res) => {
  const { error } = await db.from('citas').delete().eq('id_cita', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Cita eliminada' });
};
