const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/cita.controller');

router.get('/persona/:id_persona', ctrl.obtenerCitaPorIdPersona); // ✅ específica primero
router.get('/:id', ctrl.obtenerCitaPorId);                        // ✅ genérica después
router.get('/', ctrl.obtenerCitas);
router.post('/', ctrl.crearCita);
router.put('/:id', ctrl.actualizarCita);
router.delete('/:id', ctrl.eliminarCita);

module.exports = router;
