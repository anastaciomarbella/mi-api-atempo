// models/servicio.model.js

const Servicio = (data) => ({
  id_servicio: data.id_servicio,
  id_empresa: data.id_empresa,
  nombre: data.nombre,
  descripcion: data.descripcion || null,
  precio: data.precio,
  duracion: data.duracion || null,       // en minutos
  imagen_url: data.imagen_url || null,
  created_at: data.created_at,
});

module.exports = Servicio;