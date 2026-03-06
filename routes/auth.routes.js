const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verificarToken, verificarRol } = require('../midlewares/authMiddleware');
const upload = require('../utils/upload');

router.post('/register', upload.single('logo'), authController.registrar);
router.post('/login', authController.login);

router.get('/perfil', verificarToken, (req, res) => {
  res.json({
    message: "Perfil protegido",
    usuario: req.usuario
  });
});

router.get('/admin', verificarToken, verificarRol("admin"), (req, res) => {
  res.json({
    message: "Zona admin"
  });
});

// ✅ NUEVA - Actualizar nombre y teléfono del usuario
router.put('/usuarios/:id', verificarToken, authController.actualizarUsuario);

module.exports = router;