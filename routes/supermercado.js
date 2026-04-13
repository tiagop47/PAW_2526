const express = require('express');
const router = express.Router();

const supermarketController = require('../controllers/supermercado');
const authMiddleware = require('../middlewares/authMiddleware');
const supermarketService = require('../services/supermarketService');
const upload = require('../middlewares/upload');

router.use(authMiddleware.verificarAutenticacao, authMiddleware.verificarRole(['supermercados']), authMiddleware.verificarAprovacaoSupermercado);
router.use(async (req, res, next) => {
    try {
        if (req.user && req.user.id) {
            const supermercado = await supermarketService.getSupermercado(req.user.id);
            req.supermercado = supermercado;
        }
        next();
    } catch (err) {
        next(err);
    }
});

// Dashboard
router.get('/dashboard', supermarketController.exibirDashboard);

// Produtos
router.get('/produtos', supermarketController.exibirProdutos);
router.get('/produtos/novo', supermarketController.exibirFormularioNovo);
router.get('/produtos/:productId', supermarketController.exibirDetalhes);
router.get('/produtos/editar/:productId', supermarketController.exibirFormularioEditar);


router.get('/api/produtos', supermarketController.pesquisarProdutos);

router.post('/produtos', upload.single('imagem'), supermarketController.criarProduto);
router.post('/produtos/editar/:productId', upload.single('imagem'), supermarketController.atualizarProduto);
router.post('/produtos/eliminar/:productId', supermarketController.eliminarProduto);

// Dados do Supermercado
router.get('/editar', supermarketController.exibirEditarSupermercado);
router.post('/editar', supermarketController.atualizarSupermercado);

// Perfil
router.get('/perfil', supermarketController.exibirPerfil);

// API para verificar stock em tempo real
router.post('/api/verificar-stock', async (req, res) => {
    try {
        const { itens } = req.body;
        const resultados = [];
        let erro = false;

        for (const item of itens) {
            const produto = await supermarketService.obterProdutoPorId(req.supermercado._id, item.produtoId);
            if (!produto || produto.stockDisponivel < item.quantidade) {
                resultados.push({ 
                    produtoId: item.produtoId, 
                    nome: produto ? produto.nome : 'Desconhecido',
                    disponivel: produto ? produto.stockDisponivel : 0,
                    erro: true 
                });
                erro = true;
            } else {
                resultados.push({ produtoId: item.produtoId, erro: false });
            }
        }

        res.json({ sucesso: !erro, resultados });
    } catch (err) {
        res.status(500).json({ sucesso: false, erro: 'Erro ao verificar stock' });
    }
});

// Encomendas
router.get('/encomendas', supermarketController.listarEncomendas);
router.get('/encomendas/:orderId/fatura', supermarketController.exibirFatura);
router.post('/encomendas/:orderId/estado', supermarketController.atualizarEstadoEncomenda);

// Venda em Caixa
router.get('/vendas/nova', supermarketController.exibirVendaCaixa);
router.post('/vendas', supermarketController.registarVenda);

/**
 * Middleware de Parâmetro: Carrega o produto se :productId estiver presente no URL.
 */
router.param('productId', async (req, res, next, id) => {
    try {
        const produto = await supermarketService.obterProdutoPorId(req.supermercado._id, id);
        if (!produto) {
            return res.status(404).send('Produto não encontrado');
        }
        req.produto = produto;
        next();
    } catch (err) {
        next(err);
    }
});

/**
 * Middleware de Parâmetro: Carrega a encomenda se :orderId estiver presente no URL.
 */
router.param('orderId', async (req, res, next, id) => {
    try {
        const encomenda = await supermarketService.obterEncomendaPorId(req.supermercado._id, id);
        if (!encomenda) {
            return res.status(404).send('Encomenda não encontrada');
        }
        req.encomenda = encomenda;
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = router;
