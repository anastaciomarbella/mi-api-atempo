const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/aviso.controller');

// CRUD + lógica
router.get('/', ctrl.obtenerAvisos);
router.get('/:id', ctrl.obtenerAvisoPorId);
router.get('/persona/:id', ctrl.obtenerAvisosPorPersona);
router.post('/', ctrl.crearAviso);
router.put('/:id', ctrl.actualizarAviso);
router.delete('/:id', ctrl.eliminarAviso);

// Generar avisos automáticos (por horario o a mano)
router.post('/generar', ctrl.generarAvisosManualmente);

module.exports = router;
