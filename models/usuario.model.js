// models/usuario.model.js
function Usuario(row = {}) {
  return {
    id: row.ID_USUARIO || row.id_usuario || row.id || null,
    foto: row.FOTO || row.foto || '',
    nombreEmpresa: row.NOMBRE_EMPRESA || row.nombre_empresa || '',
    nombre: row.NOMBRE || row.nombre || '',
    correo: row.CORREO || row.correo || '',
    telefono: row.TELEFONO || row.telefono || '',
    password: row.PASSWORD || row.password || '' // este se elimina después
  };
}

module.exports = Usuario;
