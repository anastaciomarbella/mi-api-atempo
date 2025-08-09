const { createClient } = require('@supabase/supabase-js');
const Cliente = require('../models/clientes.model');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Obtener clientes frecuentes
exports.obtenerClientesFrecuentes = async (req, res) => {
  const { data, error } = await supabase.rpc('obtener_clientes_frecuentes');
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Clientes frecuentes obtenidos', clientes: data });
};

// Obtener cliente por ID
exports.obtenerClientesPorId = async (req, res) => {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('id_cliente', req.params.id)
    .single();

  if (error) return res.status(404).json({ message: 'Cliente no encontrado' });
  res.json({ message: 'Cliente encontrado', cliente: Cliente(data) });
};

// Obtener cliente por persona
exports.obtenerClientePorIdPersona = async (req, res) => {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('id_persona', req.params.id_persona);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Clientes encontrados', clientes: data.map(Cliente) });
};

// Eliminar cliente
exports.eliminarCliente = async (req, res) => {
  const { error } = await supabase
    .from('clientes')
    .delete()
    .eq('id_cliente', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Cliente eliminado' });
};
