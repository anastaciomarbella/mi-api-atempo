const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ==============================
// Configuración de multer
// ==============================
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

exports.uploadLogo = upload.single('logo');

// ==============================
// GET ALL
// ==============================
exports.getAll = async (req, res) => {
  console.log('📋 GET /empresas - obteniendo todas');

  const { data, error } = await req.supabase
    .from('empresas')
    .select('*');

  console.log('✅ Data:', data);
  console.log('❌ Error:', error);

  if (error) return res.status(500).json({ ok: false, error });
  res.json({ ok: true, data });
};

// ==============================
// GET BY ID
// ==============================
exports.getById = async (req, res) => {
  const { id } = req.params;
  console.log(`🔍 GET /empresas/${id}`);

  const { data, error } = await req.supabase
    .from('empresas')
    .select('*')
    .eq('id', id)
    .single();

  console.log('✅ Data:', data);
  console.log('❌ Error:', error);

  if (error) return res.status(404).json({ ok: false, mensaje: 'No encontrado', error });
  res.json({ ok: true, data });
};

// ==============================
// UPDATE
// ==============================
exports.update = async (req, res) => {
  const { id } = req.params;

  console.log(`✏️ PUT /empresas/${id}`);
  console.log('📥 req.body:', req.body);
  console.log('📁 req.file:', req.file);

  const campos = { ...req.body };

  if (req.file) {
    campos.logo_url = `${process.env.BASE_URL || 'https://mi-api-atempo.onrender.com'}/uploads/logos/${req.file.filename}`;
    console.log('🖼️ Logo URL generada:', campos.logo_url);
  }

  console.log('📝 Campos finales a actualizar:', campos);

  if (Object.keys(campos).length === 0) {
    console.log('⚠️ No se enviaron campos');
    return res.status(400).json({ ok: false, mensaje: 'No se enviaron datos para actualizar' });
  }

  const { data, error } = await req.supabase
    .from('empresas')
    .update(campos)
    .eq('id', id)
    .select()
    .single();

  console.log('✅ Data Supabase:', data);
  console.log('❌ Error Supabase:', error);

  if (error) return res.status(500).json({ ok: false, error });
  res.json({ ok: true, ...data });
};

// ==============================
// CREATE
// ==============================
exports.create = async (req, res) => {
  console.log('➕ POST /empresas');
  console.log('📥 req.body:', req.body);

  const { data, error } = await req.supabase
    .from('empresas')
    .insert([req.body])
    .select()
    .single();

  console.log('✅ Data:', data);
  console.log('❌ Error:', error);

  if (error) return res.status(500).json({ ok: false, error });
  res.status(201).json({ ok: true, data });
};

// ==============================
// DELETE
// ==============================
exports.delete = async (req, res) => {
  const { id } = req.params;
  console.log(`🗑️ DELETE /empresas/${id}`);

  const { error } = await req.supabase
    .from('empresas')
    .delete()
    .eq('id', id);

  console.log('❌ Error:', error);

  if (error) return res.status(500).json({ ok: false, error });
  res.json({ ok: true, mensaje: 'Eliminado correctamente' });
};