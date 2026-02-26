const express = require("express");
const router = express.Router();
const { verificarToken } = require("../midlewares/authMiddleware");
const controller = require("../controllers/cita.controller");

// ✅ Usar "/" ya que en index.js se hace app.use("/api/citas", router)
router.get("/", verificarToken, controller.obtenerCitas);
router.post("/", verificarToken, controller.crearCita);
router.put("/:id", verificarToken, controller.actualizarCita);
router.delete("/:id", verificarToken, controller.eliminarCita);

module.exports = router;