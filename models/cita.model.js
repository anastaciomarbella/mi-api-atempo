// models/Cita.js
function Cita(row) {
  return {
    id: row.id_cita || row.ID_CITA,
    id_persona_uuid: row.id_persona_uuid || row.ID_PERSONA_UUID, // UUID string
    titulo: row.titulo || row.TITULO,
    fecha: row.fecha || row.FECHA,
    hora_inicio: row.hora_inicio || row.HORA_INICIO,
    hora_final: row.hora_final || row.HORA_FINAL,
    nombre_cliente: row.nombre_cliente || row.NOMBRE_CLIENTE,
    numero_cliente: row.numero_cliente || row.NUMERO_CLIENTE,
    motivo: row.motivo || row.MOTIVO,
    color: row.color || row.COLOR || null
  };
}

module.exports = Cita;
