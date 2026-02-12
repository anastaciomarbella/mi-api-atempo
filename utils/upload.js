// utils/upload.js
const multer = require('multer');

// Almacenamiento en memoria (ideal para Supabase, Cloudinary, etc.)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB máximo
  },
  fileFilter: (req, file, cb) => {
    // Tipos permitidos
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/jpg'];

    if (tiposPermitidos.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes JPG y PNG'));
    }
  }
});

module.exports = upload;
