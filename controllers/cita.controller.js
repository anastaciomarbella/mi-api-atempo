// Función robusta: acepta "08:23 PM", "08:23 p. m.", "8:23 pm", "08:23"
function convertirHoraAmPmA24h(horaAmPm) {
  if (!horaAmPm) return null;

  const s = String(horaAmPm).trim().toLowerCase();

  // Ya en 24h: "08:23" o "8:23"
  if (/^\d{1,2}:\d{2}$/.test(s)) {
    const [h, m] = s.split(':');
    return `${String(h).padStart(2,'0')}:${m}:00`;
  }

  // Normaliza "p. m." / "a. m." -> "pm" / "am"
  const normalizada = s.replace(/\./g, '').replace(/\s+/g, ' ').trim(); // "08:23 p m" o "08:23 pm"
  const [timePart, mer1 = '', mer2 = ''] = normalizada.split(' ');
  const mer = (mer1 + mer2).replace(/[^a-z]/g, ''); // "pm", "am" o ""

  let [hours, minutes] = timePart.split(':').map(n => parseInt(n, 10));

  if (mer.includes('p') && hours < 12) hours += 12;
  if (mer.includes('a') && hours === 12) hours = 0;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
}

// =========================
// CREAR CITA
// =========================
exports.crearCita = async (req, res) => {
  try {
    const {
      id_persona_uuid, // debe ser UUID (columna uuid en BD)
      fecha,
      hora_inicio,
      hora_final,
      nombre_cliente,
      titulo,
      color,
      numero_cliente,
      motivo
    } = req.body;

    console.log('📥 Datos recibidos en req.body:', req.body);

    if (!id_persona_uuid || !fecha || !hora_inicio || !hora_final) {
      console.warn('⚠️ Faltan datos obligatorios');
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    // ⚠️ NO ENVIAR id_cita: lo crea Postgres (serial)
    const cita = {
      id_persona_uuid,
      fecha, // asegúrate que llegue como 'YYYY-MM-DD'
      hora_inicio: convertirHoraAmPmA24h(hora_inicio),
      hora_final: convertirHoraAmPmA24h(hora_final),
      nombre_cliente: nombre_cliente || null,
      numero_cliente: numero_cliente || null,
      motivo: motivo || null,
      titulo: titulo || null,
      color: color || null
    };

    console.log('📝 Cita que se insertará en BD:', cita);

    const { data, error } = await db.from('citas').insert([cita]).select();

    if (error) {
      console.error('❌ Error al insertar en BD:', error.message);
      return res.status(500).json({ error: `Error al guardar la cita: ${error.message}` });
    }

    res.status(201).json({ message: 'Cita creada', cita: data[0] });
  } catch (err) {
    console.error('🔥 Error inesperado en crearCita:', err);
    res.status(500).json({ error: 'Error interno en el servidor' });
  }
};