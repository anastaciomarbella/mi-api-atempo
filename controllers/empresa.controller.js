const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/logos';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `empresa-${req.params.id}-${Date.now()}${ext}`);
  }
});

const upload = multer({ storage });

// ==============================
// Exportar middleware de upload
// ==============================
exports.uploadLogo = upload.single('logo');

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

  const campos = { ...req.body };

  // Si subió un logo, agregar la URL
  if (req.file) {
    campos.logo_url = `${process.env.BASE_URL || 'https://mi-api-atempo.onrender.com'}/uploads/logos/${req.file.filename}`;
  }

  if (Object.keys(campos).length === 0) {
    return res.status(400).json({ ok: false, mensaje: 'No se enviaron datos para actualizar' });
  }

  const { data, error } = await req.supabase
    .from('empresas')
    .update(campos)
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ ok: false, error });
  res.json({ ok: true, ...data });
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