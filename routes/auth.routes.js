// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/auth.controller');

// Endpoint de registro
router.post('/registro', ctrl.registrar);

// Endpoint de login
router.post('/login', ctrl.login);

module.exports = router;
