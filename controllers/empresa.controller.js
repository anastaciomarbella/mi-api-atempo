// ==============================
// CONTROLADOR DE EMPRESAS
// ==============================

exports.getAll = async (req, res) => {
  const { data, error } = await req.supabase
    .from('empresas')
    .select('*');

  if (error) return res.status(500).json({ ok: false, error });
  res.json({ ok: true, data });
};

exports.getById = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await req.supabase
    .from('empresas')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return res.status(404).json({ ok: false, mensaje: 'No encontrado', error });
  res.json({ ok: true, data });
};

exports.update = async (req, res) => {
  const { id } = req.params;

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ ok: false, mensaje: 'No se enviaron datos para actualizar' });
  }

  const { data, error } = await req.supabase
    .from('empresas')
    .update(req.body)
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ ok: false, error });
  res.json({ ok: true, data });
};

exports.create = async (req, res) => {
  const { data, error } = await req.supabase
    .from('empresas')
    .insert([req.body])
    .select()
    .single();

  if (error) return res.status(500).json({ ok: false, error });
  res.status(201).json({ ok: true, data });
};

exports.delete = async (req, res) => {
  const { id } = req.params;

  const { error } = await req.supabase
    .from('empresas')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ ok: false, error });
  res.json({ ok: true, mensaje: 'Eliminado correctamente' });
};