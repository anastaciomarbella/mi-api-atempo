const Database = require('../config/db');
const db = Database.getInstance();
const citaQueries = require('../sql/postgres/cita.sql.js');
const avisoQueries = require('../sql/postgres/aviso.sql.js');

// 🔧 Utilidad para sumar tiempo
function sumarTiempo(fecha, cantidad, unidad) {
  const msPorUnidad = {
    horas: 1000 * 60 * 60,
    dias: 1000 * 60 * 60 * 24,
  };
  return new Date(fecha.getTime() + cantidad * msPorUnidad[unidad]);
}

// 📣 Función principal para generar avisos
async function generarAvisos() {
  try {
    const ahora = new Date();

    // Ejecutar query para citas en las próximas 24 horas
    const result = await db.query(citaQueries.SELECT_NEXT_24H);
    const citas = result.rows || [];

    for (const cita of citas) {
      const fechaCita = new Date(cita.fecha); // ajusta según campo fecha/hora
      const personaId = cita.id_persona;
      const citaId = cita.id_cita;

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
  // Verificar si ya existe el aviso para esa persona, cita y mensaje
  const avisosExistentes = await db.query(
    avisoQueries.SELECT_BY_PERSONA_CITA_MENSAJE_POSTGRES,
    [personaId, citaId, mensajeBase]
  );

  if (avisosExistentes.rows.length > 0) {
    // Ya existe aviso, no hacer nada
    return;
  }

  // Obtener teléfono de la persona
  const telefonoQuery = `
    SELECT telefono FROM personas WHERE id_persona = $1
  `;
  const telefonoResult = await db.query(telefonoQuery, [personaId]);
  const telefono =
    telefonoResult.rows?.[0]?.telefono ||
    'N/A';

  // Mensaje final con teléfono
  const mensajeFinal = `${mensajeBase} | WhatsApp: ${telefono}`;

  // Insertar aviso nuevo
  const idAviso = Math.floor(Math.random() * 1000000); // id aleatorio, puedes mejorar esto

  await db.query(avisoQueries.INSERT, [
    idAviso,
    personaId,
    citaId,
    mensajeFinal,
    new Date(), // fecha_aviso
  ]);

  console.log(`✅ Aviso creado para persona ${personaId}: "${mensajeFinal}"`);
}

module.exports = { generarAvisos };
