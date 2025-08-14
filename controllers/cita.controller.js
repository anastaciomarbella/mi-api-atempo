// controllers/cita.controller.js
const Database = require('../config/db');
const db = Database.getInstance().getClient();

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

// =========================
// OBTENER CITAS
// =========================
exports.obtenerCitas = async (req, res) => {
  const { data, error } = await db.from('citas').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
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
  res.json(data[0]);
};

// =========================
// OBTENER CITAS POR PERSONA
// =========================
exports.obtenerCitaPorIdPersona = async (req, res) => {
  const { data, error } = await db
    .from('citas')
    .select('*')
    .eq('id_persona', req.params.id_persona);
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// =========================
// CREAR CITA
// =========================
exports.crearCita = async (req, res) => {
  try {
    const { id_persona, fecha, hora_inicio, hora_final, nombre_cliente, titulo, color } = req.body;
    if (!id_persona || !fecha || !hora_inicio || !hora_final) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    const cita = {
      id_cita: Math.floor(Math.random() * 1000000),
      id_persona,
      fecha,
      hora_inicio: convertirHoraAmPmA24h(hora_inicio),
      hora_final: convertirHoraAmPmA24h(hora_final),
      nombre_cliente: nombre_cliente || null,
      titulo: titulo || null,
      color: color || null
    };

    const { data, error } = await db.from('citas').insert([cita]).select();
    if (error) return res.status(500).json({ error: error.message });

    res.status(201).json({ message: 'Cita creada', cita: data[0] });
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

    // Eliminar undefined para no sobreescribir campos
    Object.keys(cambios).forEach(key => cambios[key] === undefined && delete cambios[key]);

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

// =========================
// ELIMINAR CITA
// =========================
exports.eliminarCita = async (req, res) => {
  const { error } = await db.from('citas').delete().eq('id_cita', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Cita eliminada' });
};
