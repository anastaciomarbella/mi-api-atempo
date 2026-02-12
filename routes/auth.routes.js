const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/auth.controller');
const upload = require('../middlewares/upload');

// 🔹 REGISTRO DE USUARIO (CON FOTO)
router.post('/registro', upload.single('foto'), ctrl.registrar);

// 🔹 LOGIN (SIN FOTO)
router.post('/login', ctrl.login);

module.exports = router;
