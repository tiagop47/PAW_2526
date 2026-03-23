const express = require('express');
const router = express.Router();
const supermarketController = require('../Controllers/supermercado');
const { verificarAutenticacao, verificarRole, verificarAprovacaoSupermercado } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');

// Middleware de proteção global para este ficheiro
router.use(verificarAutenticacao, verificarRole(['supermercados']), verificarAprovacaoSupermercado);

// Dashboard
router.get('/dashboard', supermarketController.exibirDashboard);

// Produtos
router.get('/produtos', supermarketController.exibirProdutos);
router.get('/produtos/novo', supermarketController.exibirFormularioNovo);
router.get('/produtos/editar/:id', supermarketController.exibirFormularioEditar);
router.get('/produtos/:id', supermarketController.exibirDetalhes);

router.get('/api/produtos', supermarketController.pesquisarProdutos);

router.post('/produtos', upload.single('imagem'), supermarketController.criarProduto);
router.post('/produtos/editar/:id', upload.single('imagem'), supermarketController.atualizarProduto);
router.post('/produtos/eliminar/:id', supermarketController.eliminarProduto);

// Dados do Supermercado
router.get('/editar', supermarketController.exibirEditarSupermercado);
router.post('/editar', supermarketController.atualizarSupermercado);

// Perfil
router.get('/perfil', supermarketController.exibirPerfil);

// Encomendas
router.get('/encomendas', supermarketController.listarEncomendas);
router.post('/encomendas/:id/estado', supermarketController.atualizarEstadoEncomenda);

// Venda em Caixa
router.get('/vendas/nova', supermarketController.exibirVendaCaixa);
router.post('/vendas', supermarketController.registarVenda);

module.exports = router;