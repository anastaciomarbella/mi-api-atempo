require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Cliente Supabase como admin para saltar RLS
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 🔧 Utilidad para sumar tiempo
function sumarTiempo(fecha, cantidad, unidad) {
  const msPorUnidad = {
    horas: 1000 * 60 * 60,
    dias: 1000 * 60 * 60 * 24
  };
  return new Date(fecha.getTime() + cantidad * msPorUnidad[unidad]);
}

// 📣 Función principal para generar avisos
async function generarAvisos() {
  try {
    const ahora = new Date();

    // Traer citas en las próximas 24 horas
    const desde = ahora.toISOString();
    const hasta = new Date(ahora.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const { data: citas, error } = await supabase
      .from('citas') // 👈 cambia por tu tabla en Supabase
      .select('*')
      .gte('fecha_hora', desde)
      .lte('fecha_hora', hasta);

    if (error) {
      console.error('❌ Error obteniendo citas:', error.message);
      return;
    }

    for (const cita of citas) {
      const fechaCita = new Date(cita.fecha_hora);
      const personaId = cita.id_persona;
      const citaId = cita.id;

      // 🔔 1 día antes
      const unDiaAntes = sumarTiempo(fechaCita, -1, 'dias');
      if (ahora >= unDiaAntes && ahora < fechaCita) {
        const mensaje = `📅 Recordatorio: Tu cita es mañana (${fechaCita.toLocaleString()})`;
        await crearAvisoSiNoExiste(personaId, citaId, mensaje);
      }

      // ⏰ 3 horas antes
      const tresHorasAntes = sumarTiempo(fechaCita, -3, 'horas');
      if (ahora >= tresHorasAntes && ahora < fechaCita) {
        const mensaje = `⏰ Recordatorio: Tu cita es en 3 horas (${fechaCita.toLocaleString()})`;
        await crearAvisoSiNoExiste(personaId, citaId, mensaje);
      }
    }

    console.log('✔️ Avisos procesados');
  } catch (err) {
    console.error('❌ Error generando avisos:', err);
  }
}

// ✅ Crear aviso si no existe
async function crearAvisoSiNoExiste(personaId, citaId, mensajeBase) {
  // Verificar si ya existe el aviso
  const { data: avisosExistentes, error: avisoError } = await supabase
    .from('avisos') // 👈 tu tabla de avisos en Supabase
    .select('*')
    .eq('id_persona', personaId)
    .eq('id_cita', citaId)
    .eq('mensaje', mensajeBase);

  if (avisoError) {
    console.error('❌ Error consultando avisos:', avisoError.message);
    return;
  }

  if (avisosExistentes && avisosExistentes.length > 0) {
    return; // ya existe, no creamos de nuevo
  }

  // Buscar teléfono de la persona
  const { data: persona, error: personaError } = await supabase
    .from('personas') // 👈 tu tabla de personas en Supabase
    .select('telefono')
    .eq('id', personaId)
    .single();

  if (personaError) {
    console.error('❌ Error obteniendo teléfono:', personaError.message);
    return;
  }

  const telefono = persona?.telefono || 'N/A';
  const mensajeFinal = `${mensajeBase} | WhatsApp: ${telefono}`;

  // Insertar aviso nuevo
  const { error: insertError } = await supabase
    .from('avisos')
    .insert([{
      id_persona: personaId,
      id_cita: citaId,
      mensaje: mensajeFinal,
      fecha: new Date().toISOString()
    }]);

  if (insertError) {
    console.error('❌ Error insertando aviso:', insertError.message);
    return;
  }

  console.log(`✅ Aviso creado para persona ${personaId}: "${mensajeFinal}"`);
}

module.exports = { generarAvisos };
