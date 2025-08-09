const { createClient } = require('@supabase/supabase-js');
const { generarAvisos } = require('../utils/notificador');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Obtener todos los avisos
exports.obtenerAvisos = async (req, res) => {
  const { data, error } = await supabase.from('avisos').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// Obtener aviso por ID
exports.obtenerAvisoPorId = async (req, res) => {
  const { data, error } = await supabase
    .from('avisos')
    .select('*')
    .eq('id_aviso', req.params.id)
    .single();

  if (error) return res.status(404).json({ message: 'Aviso no encontrado' });
  res.json(data);
};

// Obtener avisos por persona
exports.obtenerAvisosPorPersona = async (req, res) => {
  const { data, error } = await supabase
    .from('avisos')
    .select('*')
    .eq('id_persona', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// Crear un aviso manualmente
exports.crearAviso = async (req, res) => {
  const { data, error } = await supabase.from('avisos').insert([req.body]);
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: 'Aviso creado', aviso: data[0] });
};

// Actualizar un aviso
exports.actualizarAviso = async (req, res) => {
  const { data, error } = await supabase
    .from('avisos')
    .update(req.body)
    .eq('id_aviso', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Aviso actualizado', aviso: data[0] });
};

// Eliminar un aviso
exports.eliminarAviso = async (req, res) => {
  const { error } = await supabase
    .from('avisos')
    .delete()
    .eq('id_aviso', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Aviso eliminado' });
};

// Generar avisos automáticamente
exports.generarAvisosManualmente = async (req, res) => {
  try {
    await generarAvisos();
    res.json({ message: 'Avisos generados manualmente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
