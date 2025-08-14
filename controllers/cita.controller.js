const Database = require('../config/db');
const db = Database.getInstance().getClient();

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
  res.json(data);
};

// Crear cita
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
      nombre_cliente,
      titulo,
      color
    };

    const { data, error } = await db.from('citas').insert([cita]).select();
    if (error) return res.status(500).json({ error: error.message });

    res.status(201).json({ message: 'Cita creada', cita: data[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error interno en el servidor' });
  }
};

// Actualizar cita
exports.actualizarCita = async (req, res) => {
  try {
    const cambios = {
      ...req.body,
      hora_inicio: convertirHoraAmPmA24h(req.body.hora_inicio),
      hora_final: convertirHoraAmPmA24h(req.body.hora_final),
    };

    const { data, error } = await db.from('citas')
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

// Eliminar cita
exports.eliminarCita = async (req, res) => {
  const { error } = await db.from('citas').delete().eq('id_cita', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Cita eliminada' });
};
