const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/clientes.controller');

router.get('/', ctrl.obtenerClientesFrecuentes);
router.get('/:id', ctrl.obtenerClientesPorId);
router.get('/clientes/:id_persona', ctrl.obtenerClientePorIdPersona);
router.delete('/:id', ctrl.eliminarCliente);

module.exports = router;
