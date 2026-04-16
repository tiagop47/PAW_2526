const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const estafetaController = require('../controllers/estafeta');
const estafetaService = require('../services/estafetaServices');

router.use(authMiddleware.verificarAutenticacao, authMiddleware.verificarRole(['estafetas']));

// Dashboard do Estafeta
router.get('/dashboard', estafetaController.exibirDashboard);

// Páginas de entregas
router.get('/entregas', estafetaController.listarEntregasDisponiveis);
router.get('/minhas-entregas', estafetaController.listarMinhasEntregas);

// API para entregas
router.get('/api/entregas', estafetaController.obterEntregasAPI);
router.get('/api/supermercados', estafetaController.obterSupermercadosAPI);
router.get('/api/supermercados-cobertura', estafetaController.obterSupermercadosCoberturaAPI);

// Operações com encomendas (Aceitar/Confirmar)
router.post('/api/entregas/:orderId/aceitar', estafetaController.aceitarEntrega);
router.post('/api/entregas/:orderId/confirmar', estafetaController.confirmarEntrega);

/**
 * Middleware de Parâmetro: Carrega a encomenda se :orderId estiver presente no URL.
 * Uniformiza com o padrão do Administrador e Supermercado.
 */
router.param('orderId', async (req, res, next, id) => {
    try {
        const encomenda = await estafetaService.obterEncomendaPorId(id);
        if (!encomenda) {
            return res.status(404).json({ sucesso: false, erro: 'Encomenda não encontrada' });
        }
        req.encomenda = encomenda;
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = router;
