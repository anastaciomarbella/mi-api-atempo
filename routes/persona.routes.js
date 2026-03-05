const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/persona.controller');
const { verificarToken } = require('../midlewares/authMiddleware');

router.get('/', verificarToken, ctrl.obtenerPersonas);
router.get('/:id', verificarToken, ctrl.obtenerPersonaPorId);
router.post('/', verificarToken, ctrl.crearPersona);
router.put('/:id', verificarToken, ctrl.actualizarPersona);
router.delete('/:id', verificarToken, ctrl.eliminarPersona);

module.exports = router;