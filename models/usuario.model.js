// models/usuario.model.js
function Usuario(row = {}) {
  return {
    id: row.ID_USUARIO || row.id_usuario || row.id || null,
    nombre: row.NOMBRE || row.nombre || '',
    correo: row.CORREO || row.correo || '',
    telefono: row.TELEFONO || row.telefono || '',
    password: row.PASSWORD || row.password || '' // este se elimina después
  };
}

module.exports = Usuario;
