const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

router.post('/register', authController.registrar);
router.post('/login', authController.login);

// Ruta protegida
router.get('/perfil', verificarToken, (req, res) => {
  res.json({
    message: "Perfil protegido",
    usuario: req.usuario
  });
});

// Solo admin
router.get('/admin', verificarToken, verificarRol("admin"), (req, res) => {
  res.json({
    message: "Zona admin"
  });
});

module.exports = router;
