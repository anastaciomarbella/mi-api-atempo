const multer = require('multer');

// Guardar el archivo en memoria (buffer)
// Ideal para subirlo directo a Supabase Storage
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB máximo
  },
  fileFilter: (req, file, cb) => {
    // Aceptar solo imágenes
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(
        new Error('Solo se permiten archivos de imagen (jpg, png, jpeg, webp)'),
        false
      );
    }
  },
});

module.exports = upload;

