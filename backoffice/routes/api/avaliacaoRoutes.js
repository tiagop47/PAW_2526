const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const avaliacaoApiController = require('../../controllers/api/avaliacaoApiController');

const autenticado = [authMiddleware.verificarAutenticacao, authMiddleware.verificarRole(['clientes'])];

router.get('/', autenticado, avaliacaoApiController.getMinhasAvaliacoes);
router.post('/', autenticado, avaliacaoApiController.criarAvaliacao);
router.get('/supermercado/:supermercadoId', avaliacaoApiController.getAvaliacoesPorSupermercado);

module.exports = router;
