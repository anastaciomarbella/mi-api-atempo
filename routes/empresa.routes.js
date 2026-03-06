const express = require('express');
const router = express.Router();
const empresaController = require('../controllers/empresa.controller');

router.get('/',       empresaController.getAll);
router.get('/:id',    empresaController.getById);
router.post('/',      empresaController.create);
router.put('/:id',    empresaController.uploadLogo, empresaController.update); // ✅ multer antes del update
router.delete('/:id', empresaController.delete);

module.exports = router;