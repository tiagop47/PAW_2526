const express = require('express');
const router = express.Router();
const supermarketController = require('../Controllers/supermercado');
const { verificarAutenticacao, verificarRole, verificarAprovacaoSupermercado } = require('../middlewares/authMiddleware');

// Middleware de proteção global para este ficheiro
router.use(verificarAutenticacao, verificarRole(['supermercados']), verificarAprovacaoSupermercado);

router.get('/dashboard', supermarketController.exibirDashboard);
router.get('/produtos', supermarketController.exibirProdutos);
router.get('/produtos/novo', supermarketController.exibirFormularioNovo);
router.get('/produtos/:id', supermarketController.exibirDetalhes);
router.get('/produtos/editar/:id', supermarketController.exibirFormularioEditar);


router.get('/api/produtos', supermarketController.pesquisarProdutos);

router.post('/produtos', supermarketController.criarProduto);
router.post('/produtos/editar/:id', supermarketController.atualizarProduto);

module.exports = router;