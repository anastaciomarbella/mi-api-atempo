const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/auth.controller');
const multer = require('multer');

// Configurar carpeta temporal
const upload = multer({ dest: 'uploads/' });

// Endpoint de registro con foto opcional
router.post('/registro', upload.single('foto'), ctrl.registrar);

// Endpoint de login
router.post('/login', ctrl.login);

module.exports = router;
