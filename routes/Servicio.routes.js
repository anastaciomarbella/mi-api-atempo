const express = require("express");
const router = express.Router();
const servicioController = require("../controllers/service.controller");
const { verificarToken } = require("../midlewares/authMiddleware");

router.get("/", verificarToken, servicioController.obtenerServicios);

router.post(
  "/",
  verificarToken,
  servicioController.upload.single("imagen"),
  servicioController.crearServicio
);

router.put(
  "/:id",
  verificarToken,
  servicioController.upload.single("imagen"),
  servicioController.actualizarServicio
);

router.delete("/:id", verificarToken, servicioController.eliminarServicio);

module.exports = router;