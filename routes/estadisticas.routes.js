const express = require("express");
const router  = express.Router();
const { obtenerEstadisticas } = require("../controllers/estadisticas.controller");
const authMiddleware = require("../midlewares/authMiddleware"); // mismo middleware que usas en cita.routes.js

// GET /api/estadisticas?periodo=dia|semana|mes
router.get("/", authMiddleware, obtenerEstadisticas);

module.exports = router;