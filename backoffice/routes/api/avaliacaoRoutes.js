const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const avaliacaoApiController = require('../../controllers/api/avaliacaoApiController');

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Gestão de avaliações de encomendas e supermercados
 */

const autenticado = [authMiddleware.verificarAutenticacao, authMiddleware.verificarRole(['clientes'])];

/**
 * @swagger
 * /api/avaliacoes:
 *   get:
 *     summary: Obtém as avaliações do utilizador autenticado
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de avaliações
 *       500:
 *         description: Erro no servidor
 */
router.get('/', autenticado, avaliacaoApiController.getMinhasAvaliacoes);

/**
 * @swagger
 * /api/avaliacoes:
 *   post:
 *     summary: Cria uma nova avaliação para uma encomenda
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - encomendaId
 *               - nota
 *             properties:
 *               encomendaId:
 *                 type: string
 *               nota:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comentario:
 *                 type: string
 *     responses:
 *       201:
 *         description: Avaliação criada com sucesso
 *       404:
 *         description: Encomenda não encontrada
 *       409:
 *         description: Encomenda já foi avaliada
 *       500:
 *         description: Erro no servidor
 */
router.post('/', autenticado, avaliacaoApiController.criarAvaliacao);

/**
 * @swagger
 * /api/avaliacoes/supermercado/{supermercadoId}:
 *   get:
 *     summary: Obtém as avaliações de um supermercado específico
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: supermercadoId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do supermercado
 *     responses:
 *       200:
 *         description: Dados das avaliações e média
 *       500:
 *         description: Erro no servidor
 */
router.get('/supermercado/:supermercadoId', avaliacaoApiController.getAvaliacoesPorSupermercado);

module.exports = router;
