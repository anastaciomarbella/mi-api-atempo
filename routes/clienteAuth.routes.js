const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/clienteAuth.controller');
const { verificarCliente } = require('../midlewares/clienteAuthmiddleware');

router.post('/registro', ctrl.registrarCliente);
router.post('/login', ctrl.loginCliente);
router.get('/mis-citas', verificarCliente, ctrl.obtenerMisCitas);
router.put('/editar-cita/:id_cita', verificarCliente, ctrl.editarCita);

module.exports = router;