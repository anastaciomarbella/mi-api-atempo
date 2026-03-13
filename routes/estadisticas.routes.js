const express = require("express");
const router = express.Router();

const { obtenerEstadisticas } = require("../controllers/estadisticas.controller");
const { verificarToken } = require("../midlewares/authMiddleware");

router.get("/", verificarToken, obtenerEstadisticas);

module.exports = router;
