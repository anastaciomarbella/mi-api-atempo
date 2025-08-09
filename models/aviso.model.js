function Aviso(row) {
  return {
    id: row.ID_AVISO || row.id_aviso,
    personaId: row.PERDONAID || row.id_persona,
    citaId: row.CIDAID || row.id_cita,
    mensaje: row.MENSAJE || row.mensaje,
    fechaAviso: row.FECHAAVISO || row.fecha_aviso
  };
}

module.exports = Aviso;
