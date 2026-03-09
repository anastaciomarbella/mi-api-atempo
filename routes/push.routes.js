const express = require("express");
const router = express.Router();

/* ===============================
   SUSCRIBIR NAVEGADOR
=============================== */
router.post("/suscribir", (req, res) => {
  // guardar suscripción push
});

/* ===============================
   DESUSCRIBIR NAVEGADOR
=============================== */
router.post("/desuscribir", (req, res) => {
  // eliminar suscripción
});

/* ===============================
   ENVIAR NOTIFICACIÓN DE PRUEBA
=============================== */
router.post("/enviar-prueba", async (req, res) => {
  // enviar push de prueba
});

module.exports = router;