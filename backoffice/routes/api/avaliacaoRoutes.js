const express = require('express');
const router = express.Router();
const avaliacaoApiController = require('../../controllers/api/avaliacaoApiController');

router.post('/', avaliacaoApiController.criarAvaliacao);
router.get('/supermercado/:supermercadoId', avaliacaoApiController.getAvaliacoesPorSupermercado);

module.exports = router;
