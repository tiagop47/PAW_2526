const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const estafetaController = require('../../controllers/estafeta');
const estafetaService = require('../../services/estafetaServices');

router.use(authMiddleware.verificarAutenticacao, authMiddleware.verificarRole(['estafetas']));

router.get('/entregas', estafetaController.obterEntregasAPI);
router.post('/entregas/:orderId/aceitar', estafetaController.aceitarEntrega);
router.post('/entregas/:orderId/confirmar', estafetaController.confirmarEntrega);

router.param('orderId', async (req, res, next, id) => {
    try {
        const encomenda = await estafetaService.obterEncomendaPorId(id);
        if (!encomenda) return res.status(404).json({ sucesso: false, erro: 'Encomenda não encontrada' });
        req.encomenda = encomenda;
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = router;
