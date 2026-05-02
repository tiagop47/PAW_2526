const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../../models/OrderModel');
const authMiddleware = require('../../middlewares/authMiddleware');
const orderApiController = require('../../controllers/api/orderApiController');

// Todas as rotas requerem autenticação e role 'clientes'
router.use(authMiddleware.verificarAutenticacao, authMiddleware.verificarRole(['clientes']));

// Middleware para validar ID e carregar a encomenda automaticamente
router.param('id', async (req, res, next, id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ sucesso: false, erro: 'ID de encomenda inválido' });
    }

    try {
        // Garantimos que a encomenda pertence ao cliente autenticado
        const encomenda = await Order.findOne({ _id: id, clienteId: req.user.id });
        if (!encomenda) {
            return res.status(404).json({ sucesso: false, erro: 'Encomenda não encontrada.' });
        }
        req.encomenda = encomenda;
        next();
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Listar encomendas do cliente autenticado
 *     tags: [Encomendas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de encomendas
 */
router.get('/', orderApiController.listarEncomendas);

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Criar uma nova encomenda
 *     tags: [Encomendas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [supermercadoId, produtos]
 *             properties:
 *               supermercadoId:
 *                 type: string
 *               produtos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     produtoId:
 *                       type: string
 *                     quantidade:
 *                       type: number
 *               metodoEntrega:
 *                 type: string
 *                 enum: [levantamento_loja, entrega_domicilio]
 *               moradaEntrega:
 *                 type: string
 *     responses:
 *       201:
 *         description: Encomenda criada com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/', orderApiController.criarEncomenda);

/**
 * @swagger
 * /api/orders/validar-cupao:
 *   post:
 *     summary: Validar um cupão promocional
 *     tags: [Encomendas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [codigo, supermercadoId]
 *             properties:
 *               codigo:
 *                 type: string
 *               supermercadoId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cupão válido
 *       400:
 *         description: Cupão inválido
 */
router.post('/validar-cupao', orderApiController.validarCupao);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Obter detalhes de uma encomenda
 *     tags: [Encomendas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalhes da encomenda
 *       404:
 *         description: Encomenda não encontrada
 */
router.get('/:id', orderApiController.obterEncomenda);

/**
 * @swagger
 * /api/orders/{id}/cancelar:
 *   post:
 *     summary: Cancelar uma encomenda (até 5 min após confirmação)
 *     tags: [Encomendas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Encomenda cancelada
 *       400:
 *         description: Cancelamento não permitido
 */
router.post('/:id/cancelar', orderApiController.cancelarEncomenda);

/**
 * @swagger
 * /api/orders/{id}/confirmar-rececao:
 *   post:
 *     summary: Confirmar receção de uma encomenda entregue pelo estafeta
 *     tags: [Encomendas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Receção confirmada
 *       400:
 *         description: Encomenda não disponível para confirmação
 */
router.post('/:id/confirmar-rececao', orderApiController.confirmarRececao);

module.exports = router;
