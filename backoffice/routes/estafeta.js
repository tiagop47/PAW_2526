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
