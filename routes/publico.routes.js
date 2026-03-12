const express = require('express');
const router  = express.Router();

const publicoController = require('../controllers/publico.controller');

router.get('/:slug',                  publicoController.obtenerEmpresa);
router.get('/:slug/personas',         publicoController.obtenerPersonas);
router.get('/:slug/servicios',        publicoController.obtenerServiciosPublicos); // ← NUEVO
router.get('/:slug/citas-ocupadas',   publicoController.obtenerCitasOcupadas);
router.post('/:slug/citas',           publicoController.crearCitaPublica);

module.exports = router;