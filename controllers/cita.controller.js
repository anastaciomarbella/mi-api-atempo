// controllers/cita.controller.js
const Database = require('../config/db');
const db = Database.getInstance();
const Cita = require('../models/cita.model');

const generarId = () => Math.floor(Math.random() * 1000000);

// Función para convertir hora AM/PM a 24h
function convertirHoraAmPmA24h(horaAmPm) {
  if (!horaAmPm) return null;
  const [time, modifier] = horaAmPm.trim().split(' ');
  let [hours, minutes] = time.split(':');
  hours = parseInt(hours, 10);
  if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
  if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${minutes}:00`;
}

// Obtener todas las citas
exports.obtenerCitas = async (req, res) => {
  const { data, error } = await db.from('citas').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data.map(Cita));
};

// Obtener cita por ID
exports.obtenerCitaPorId = async (req, res) => {
  const { data, error } = await db
    .from('citas')
    .select('*')
    .eq('id_cita', req.params.id)
    .single();

  if (error) return res.status(404).json({ message: 'Cita no encontrada' });
  res.json(Cita(data));
};

// Obtener citas por persona
exports.obtenerCitaPorIdPersona = async (req, res) => {
  const { data, error } = await db
    .from('citas')
    .select('*')
    .eq('id_persona', req.params.id_persona);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// Crear cita
exports.crearCita = async (req, res) => {
  const cita = {
    id_cita: generarId(),
    ...req.body,
    hora_inicio: convertirHoraAmPmA24h(req.body.hora_inicio),
    hora_final: convertirHoraAmPmA24h(req.body.hora_final),
  };

  const { data, error } = await db.from('citas').insert([cita]);
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: 'Cita creada', cita: data[0] });
};

// Actualizar cita
exports.actualizarCita = async (req, res) => {
  const cambios = {
    ...req.body,
    hora_inicio: convertirHoraAmPmA24h(req.body.hora_inicio),
    hora_final: convertirHoraAmPmA24h(req.body.hora_final),
  };

  const { data, error } = await db
    .from('citas')
    .update(cambios)
    .eq('id_cita', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Cita actualizada', cita: data[0] });
};

// Eliminar cita
exports.eliminarCita = async (req, res) => {
  const { error } = await db
    .from('citas')
    .delete()
    .eq('id_cita', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Cita eliminada' });
};
