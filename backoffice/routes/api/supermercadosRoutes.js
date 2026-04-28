const express = require('express');
const router = express.Router();
const supermercadoApiController = require('../../controllers/api/supermercadoApiController');

router.get('/', supermercadoApiController.getSupermercados);
router.get('/promocoes', supermercadoApiController.getPromocoes);
router.get('/categorias', supermercadoApiController.getCategorias);

module.exports = router;
