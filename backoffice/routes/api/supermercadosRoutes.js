const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Supermarket = require('../../models/SupermarketModel');
const supermercadoApiController = require('../../controllers/api/supermercadoApiController');

/**
 * @swagger
 * tags:
 *   name: Supermarkets
 *   description: Gestão de supermercados e categorias
 */

// Middleware para validar ID e carregar o supermercado automaticamente
router.param('id', async (req, res, next, id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'ID de supermercado inválido' });
    }

    try {
        const supermercado = await Supermarket.findById(id);
        if (!supermercado) {
            return res.status(404).json({ error: 'Supermercado não encontrado' });
        }
        req.supermercado = supermercado;
        next();
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /api/supermercados:
 *   get:
 *     summary: Lista todos os supermercados
 *     tags: [Supermarkets]
 *     responses:
 *       200:
 *         description: Lista de supermercados
 *       500:
 *         description: Erro ao carregar supermercados
 */
router.get('/', supermercadoApiController.getSupermercados);

/**
 * @swagger
 * /api/supermercados/promocoes:
 *   get:
 *     summary: Obtém promoções em destaque para a página inicial
 *     tags: [Supermarkets]
 *     responses:
 *       200:
 *         description: Dados das promoções
 *       500:
 *         description: Erro ao carregar promoções
 */
router.get('/promocoes', supermercadoApiController.getPromocoes);

/**
 * @swagger
 * /api/supermercados/categorias:
 *   get:
 *     summary: Lista todas as categorias de produtos
 *     tags: [Supermarkets]
 *     responses:
 *       200:
 *         description: Lista de categorias
 *       500:
 *         description: Erro ao carregar categorias
 */
router.get('/categorias', supermercadoApiController.getCategorias);

/**
 * @swagger
 * /api/supermercados/{id}:
 *   get:
 *     summary: Obtém detalhes de um supermercado pelo ID
 *     tags: [Supermarkets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do supermercado
 *     responses:
 *       200:
 *         description: Detalhes do supermercado
 *       400:
 *         description: ID de supermercado inválido
 *       404:
 *         description: Supermercado não encontrado
 */
router.get('/:id', supermercadoApiController.getSupermercadoById);

/**
 * @swagger
 * /api/supermercados/{id}/metodoPreco:
 *   get:
 *     summary: Obtém os métodos de custo de entrega de um supermercado
 *     tags: [Supermarkets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do supermercado
 *     responses:
 *       200:
 *         description: Métodos de custo
 *       500:
 *         description: Erro ao carregar métodos de preço
 */
router.get('/:id/metodoPreco', supermercadoApiController.getMetodosCusto);

/**
 * @swagger
 * /api/supermercados/{id}/cupoes:
 *   get:
 *     summary: Lista os cupões disponíveis para um supermercado
 *     tags: [Supermarkets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do supermercado
 *     responses:
 *       200:
 *         description: Lista de cupões
 *       500:
 *         description: Erro ao carregar cupões
 */
router.get('/:id/cupoes', supermercadoApiController.getCupoes);

module.exports = router;
