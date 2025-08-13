// controllers/clientes.controller.js
const Database = require('../config/db');
const db = Database.getInstance();
const Cliente = require('../models/clientes.model');

// Obtener clientes frecuentes
exports.obtenerClientesFrecuentes = async (req, res) => {
  // Nota: supabase.rpc es para llamadas a funciones remotas (RPC) en Supabase.
  // Si tienes esa función definida en la base, la puedes usar así:
  const { data, error } = await db.getClient().rpc('obtener_clientes_frecuentes');
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Clientes frecuentes obtenidos', clientes: data });
};

// Obtener cliente por ID
exports.obtenerClientesPorId = async (req, res) => {
  const { data, error } = await db.from('clientes').select('*').eq('id_cliente', req.params.id).single();
  if (error) return res.status(404).json({ message: 'Cliente no encontrado' });
  res.json({ message: 'Cliente encontrado', cliente: Cliente(data) });
};

// Obtener cliente por persona
exports.obtenerClientePorIdPersona = async (req, res) => {
  const { data, error } = await db.from('clientes').select('*').eq('id_persona', req.params.id_persona);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Clientes encontrados', clientes: data.map(Cliente) });
};

// Eliminar cliente
exports.eliminarCliente = async (req, res) => {
  const { error } = await db.from('clientes').delete().eq('id_cliente', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Cliente eliminado' });
};
