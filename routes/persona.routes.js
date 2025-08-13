// routes/persona.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/persona.controller');


router.get('/', ctrl.obtenerPersonas);
router.get('/:id', ctrl.obtenerPersonaPorId);
router.post('/', ctrl.crearPersona);
router.put('/:id', ctrl.actualizarPersona);
router.delete('/:id', ctrl.eliminarPersona);

module.exports = router;
