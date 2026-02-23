const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');

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

module.exports = router;