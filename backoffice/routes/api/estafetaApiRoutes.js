const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const estafetaController = require('../../controllers/estafeta');
const estafetaService = require('../../services/estafetaServices');

/**
 * @swagger
 * tags:
 *   name: Couriers
 *   description: Operações relacionadas com estafetas e entregas
 */

router.use(authMiddleware.verificarAutenticacao, authMiddleware.verificarRole(['estafetas']));

/**
 * @swagger
 * /api/estafeta/entregas:
 *   get:
 *     summary: Lista todas as entregas disponíveis para estafetas
 *     tags: [Couriers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de entregas disponíveis
 *       500:
 *         description: Erro no servidor
 */
router.get('/entregas', estafetaController.obterEntregasAPI);

/**
 * @swagger
 * /api/estafeta/entregas/{orderId}/aceitar:
 *   post:
 *     summary: Aceita uma entrega disponível
 *     tags: [Couriers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da encomenda
 *     responses:
 *       200:
 *         description: Entrega aceite com sucesso
 *       400:
 *         description: Erro ao aceitar entrega
 *       404:
 *         description: Encomenda não encontrada
 */
router.post('/entregas/:orderId/aceitar', estafetaController.aceitarEntrega);

/**
 * @swagger
 * /api/estafeta/entregas/{orderId}/confirmar:
 *   post:
 *     summary: Confirma a conclusão de uma entrega
 *     tags: [Couriers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da encomenda
 *     responses:
 *       200:
 *         description: Entrega confirmada com sucesso
 *       400:
 *         description: Erro ao confirmar entrega
 *       404:
 *         description: Encomenda não encontrada
 */
router.post('/entregas/:orderId/confirmar', estafetaController.confirmarEntrega);

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
