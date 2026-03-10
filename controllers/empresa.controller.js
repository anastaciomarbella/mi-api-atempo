const multer  = require('multer');
const { createClient } = require('@supabase/supabase-js');

// ── Cliente Supabase con service role (para Storage) ─────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // necesita service_role, no anon
);

// ── Multer en memoria (NO disco — Render no persiste archivos) ────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB máximo
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes JPG, PNG o WebP'));
    }
  }
});

exports.uploadLogo = upload.single('logo');

// ── Helper: subir buffer a Supabase Storage ───────────────────────────────────
async function subirLogoASupabase(idEmpresa, file) {
  const ext      = file.originalname.split('.').pop().toLowerCase();
  const filePath = `${idEmpresa}/logo.${ext}`;

  const { error } = await supabase.storage
    .from('logo')                    // nombre de tu bucket
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true,                      // sobreescribe si ya existe
    });

  if (error) throw new Error(`Error Supabase Storage: ${error.message}`);

  const { data } = supabase.storage
    .from('logotipo')
    .getPublicUrl(filePath);

  // Añadir cache-buster para que el navegador no muestre la versión anterior
  return `${data.publicUrl}?t=${Date.now()}`;
}

// ==============================
// GET ALL
// ==============================
exports.getAll = async (req, res) => {
  const { data, error } = await req.supabase.from('empresas').select('*');
  if (error) return res.status(500).json({ ok: false, error });
  res.json({ ok: true, data });
};

// ==============================
// GET BY ID
// ==============================
exports.getById = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await req.supabase
    .from('empresas')
    .select('*')
    .eq('id_empresa', id);
  if (error) return res.status(404).json({ ok: false, mensaje: 'No encontrado', error });
  res.json({ ok: true, data });
};

// ==============================
// UPDATE  ← logo ahora va a Supabase Storage
// ==============================
exports.update = async (req, res) => {
  const { id } = req.params;

  const campos = {};

  if (req.body.nombre_empresa) campos.nombre_empresa = req.body.nombre_empresa;
  if (req.body.slug)           campos.slug           = req.body.slug;

  // Si viene un archivo, subirlo a Supabase Storage
  if (req.file) {
    try {
      campos.logo_url = await subirLogoASupabase(id, req.file);
      console.log('🖼️ Logo subido a Supabase:', campos.logo_url);
    } catch (err) {
      console.error('❌ Error subiendo logo:', err.message);
      return res.status(500).json({ ok: false, mensaje: err.message });
    }
  }

  if (Object.keys(campos).length === 0) {
    return res.status(400).json({ ok: false, mensaje: 'No se enviaron datos para actualizar' });
  }

  const { data, error } = await req.supabase
    .from('empresas')
    .update(campos)
    .eq('id_empresa', id)
    .select()
    .single();

  if (error) return res.status(500).json({ ok: false, error });

  res.json({ ok: true, ...data });
};

// ==============================
// CREATE
// ==============================
exports.create = async (req, res) => {
  const { data, error } = await req.supabase
    .from('empresas')
    .insert([req.body])
    .select()
    .single();
  if (error) return res.status(500).json({ ok: false, error });
  res.status(201).json({ ok: true, data });
};

// ==============================
// DELETE
// ==============================
exports.delete = async (req, res) => {
  const { id } = req.params;
  const { error } = await req.supabase
    .from('empresas')
    .delete()
    .eq('id_empresa', id);
  if (error) return res.status(500).json({ ok: false, error });
  res.json({ ok: true, mensaje: 'Eliminado correctamente' });
};