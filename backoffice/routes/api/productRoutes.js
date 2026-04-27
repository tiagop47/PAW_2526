const express = require('express');
const router = express.Router();
const productApiController = require('../../controllers/api/productApiController');

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Listagem geral de produtos
 *     tags: [Produtos]
 *     responses:
 *       200:
 *         description: Lista de produtos obtida com sucesso
 */
router.get('/', productApiController.getAllProducts);

/**
 * @swagger
 * /api/products/catalogo:
 *   get:
 *     summary: Lista todos os produtos do catálogo partilhado
 *     tags: [Produtos]
 *     responses:
 *       200:
 *         description: Lista de produtos do catálogo
 */
router.get('/catalogo', productApiController.getCatalogo);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Obter detalhes de um produto
 *     tags: [Produtos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Produto encontrado
 *       404:
 *         description: Produto não encontrado
 */
router.get('/:id', productApiController.getProductById);

module.exports = router;
