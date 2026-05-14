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

            if (!supermercado) {
                // Caso o user tenha role de supermercado mas ainda não tenha o perfil criado ou aprovado
                if (req.path === '/perfil' || req.path === '/editar') {
                    req.supermercado = null;
                    return next();
                }

                return res.render('supermercado/aguardaAprovacao', {
                    title: 'Perfil Incompleto',
                    estado: 'Pendente',
                    user: req.user
                });
            }

            req.supermercado = supermercado;
        }
        next();
    } catch (err) {
        next(err);
    }
});

// Dashboard
router.get('/dashboard', supermarketController.exibirDashboard);

// Endpoints JSON (backoffice JS)
router.get('/produtos/pesquisar', supermarketController.pesquisarProdutos);
router.post('/vendas/verificar-stock', supermarketController.verificarStock);

// Produtos
router.get('/produtos', supermarketController.exibirProdutos);
router.get('/produtos/novo', supermarketController.exibirFormularioNovo);
router.get('/produtos/:productId', supermarketController.exibirDetalhes);
router.get('/produtos/editar/:productId', supermarketController.exibirFormularioEditar);

router.post('/produtos', upload.single('imagem'), supermarketController.criarProduto);
router.post('/produtos/editar/:productId', upload.single('imagem'), supermarketController.atualizarProduto);

// Dados do Supermercado
router.get('/editar', supermarketController.exibirEditarSupermercado);
router.post('/editar', supermarketController.atualizarSupermercado);

// Avaliações
router.get('/avaliacoes', supermarketController.exibirAvaliacoes);

// Reclamações
router.get('/reclamacoes', supermarketController.listarReclamacoes);
router.post('/reclamacoes/:reclamacaoId/responder', supermarketController.responderReclamacao);

// Perfil
router.get('/perfil', supermarketController.exibirPerfil);

// Encomendas
router.get('/encomendas', supermarketController.listarEncomendas);
router.get('/encomendas/ajuda', supermarketController.exibirAjudaEncomendas);
router.get('/encomendas/:orderId', supermarketController.exibirDetalhesEncomenda);
router.get('/encomendas/:orderId/fatura', supermarketController.exibirFatura);
router.post('/encomendas/:orderId/estado', supermarketController.atualizarEstadoEncomenda);

// Venda
router.get('/vendas/nova', supermarketController.exibirVendaCaixa);
router.post('/vendas', supermarketController.registarVenda);

// Cupões
router.get('/cupoes', supermarketController.exibirCupoes);
router.post('/cupoes', supermarketController.criarCupao);
router.post('/cupoes/desativar/:cupaoId', supermarketController.desativarCupao);
router.post('/cupoes/ativar/:cupaoId', supermarketController.ativarCupao);
router.post('/cupoes/eliminar/:cupaoId', supermarketController.eliminarCupao);

/**
 * Middleware de Parâmetro: Carrega o produto se :productId estiver presente no URL.
 */
router.param('productId', async (req, res, next, id) => {
    try {
        // Agora usamos a função unificada passando o ID do supermercado para segurança
        const produto = await supermarketService.obterProdutoPorId(id, req.supermercado._id);
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

/**
 * Middleware de Parâmetro: Carrega o cupão se :cupaoId estiver presente no URL.
 */
router.param('cupaoId', async (req, res, next, id) => {
    try {
        const cupao = await cupaoService.obterCupaoPorId(id, req.supermercado._id);
        if (!cupao) {
            return res.status(404).send('Cupão não encontrado');
        }
        req.cupao = cupao;
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = router;
