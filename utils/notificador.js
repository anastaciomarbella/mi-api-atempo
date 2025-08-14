const Database = require('../config/db');
const db = Database.getInstance().getClient();

function sumarTiempo(fecha, cantidad, unidad) {
  const msPorUnidad = { horas: 1000*60*60, dias: 1000*60*60*24 };
  return new Date(fecha.getTime() + cantidad*msPorUnidad[unidad]);
}

async function generarAvisos() {
  try {
    const ahora = new Date();

    const { data: citas, error } = await db.from('citas')
      .select('*')
      .gte('fecha', ahora.toISOString())
      .lte(new Date(ahora.getTime()+24*60*60*1000).toISOString());
    if (error) throw error;

    for (const cita of citas) {
      const fechaCita = new Date(cita.fecha);
      const personaId = cita.id_persona;
      const citaId = cita.id_cita;

      const unDiaAntes = sumarTiempo(fechaCita, -1, 'dias');
      if (ahora >= unDiaAntes && ahora < fechaCita) {
        await crearAvisoSiNoExiste(personaId, citaId, `📅 Recordatorio: Tu cita es mañana (${fechaCita.toLocaleString()})`);
      }

      const tresHorasAntes = sumarTiempo(fechaCita, -3, 'horas');
      if (ahora >= tresHorasAntes && ahora < fechaCita) {
        await crearAvisoSiNoExiste(personaId, citaId, `⏰ Recordatorio: Tu cita es en 3 horas (${fechaCita.toLocaleString()})`);
      }
    }
    console.log('✔️ Avisos procesados');
  } catch (err) {
    console.error('❌ Error generando avisos:', err);
  }
}

async function crearAvisoSiNoExiste(personaId, citaId, mensajeBase) {
  const { data: avisosExistentes } = await db.from('avisos')
    .select('*')
    .eq('id_persona', personaId)
    .eq('id_cita', citaId)
    .eq('mensaje', mensajeBase);
  if (avisosExistentes.length > 0) return;

  const { data: personaData } = await db.from('personas')
    .select('telefono')
    .eq('id_persona', personaId)
    .single();
  const telefono = personaData?.telefono || 'N/A';
  const mensajeFinal = `${mensajeBase} | WhatsApp: ${telefono}`;

  await db.from('avisos').insert([{
    id_aviso: Math.floor(Math.random()*1000000),
    id_persona: personaId,
    id_cita: citaId,
    mensaje: mensajeFinal,
    fecha_aviso: new Date()
  }]);

  console.log(`✅ Aviso creado para persona ${personaId}: "${mensajeFinal}"`);
}

module.exports = { generarAvisos };
