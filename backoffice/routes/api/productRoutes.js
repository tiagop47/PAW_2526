const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../../models/ProductModel');
const productApiController = require('../../controllers/api/productApiController');

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Gestão de produtos e catálogo
 */

// Middleware para validar ID e carregar o produto automaticamente
router.param('id', async (req, res, next, id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'ID de produto inválido' });
    }

    try {
        const produto = await Product.findById(id).populate('supermercadoId', 'nome localizacao').populate('categoriaId');
        if (!produto) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }
        req.produto = produto;
        next();
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Lista todos os produtos
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: supermercado
 *         schema:
 *           type: string
 *         description: ID do supermercado para filtrar
 *       - in: query
 *         name: nome
 *         schema:
 *           type: string
 *         description: Nome do produto para pesquisa/comparação
 *     responses:
 *       200:
 *         description: Lista de produtos
 *       500:
 *         description: Erro ao carregar produtos
 */
router.get('/', productApiController.getAllProducts);

/**
 * @swagger
 * /api/products/catalogo:
 *   get:
 *     summary: Lista todos os produtos do catálogo partilhado
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Lista do catálogo
 *       500:
 *         description: Erro ao carregar catálogo
 */
router.get('/catalogo', productApiController.getCatalogo);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Obtém detalhes de um produto pelo ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do produto
 *     responses:
 *       200:
 *         description: Detalhes do produto
 *       400:
 *         description: ID de produto inválido
 *       404:
 *         description: Produto não encontrado
 */
router.get('/:id', productApiController.getProductById);

module.exports = router;
