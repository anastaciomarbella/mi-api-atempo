const express = require("express");
const router = express.Router();
const { verificarToken } = require("../midlewares/authMiddleware");
const controller = require("../controllers/cita.controller");

router.get("/citas", verificarToken, controller.obtenerCitas);
router.post("/citas", verificarToken, controller.crearCita);
router.put("/citas/:id", verificarToken, controller.actualizarCita);
router.delete("/citas/:id", verificarToken, controller.eliminarCita);

module.exports = router;