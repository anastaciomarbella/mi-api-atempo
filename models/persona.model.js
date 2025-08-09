function Persona(row) {
  return {
    id: row.ID_PERSONA || row.id_persona,
    nombre: row.NOMBRE || row.nombre,
    email: row.EMAIL || row.email,
    telefono: row.TELEFONO || row.telefono
  };
}

module.exports = Persona;