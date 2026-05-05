const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../../models/ProductModel');
const productApiController = require('../../controllers/api/productApiController');

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

router.get('/', productApiController.getAllProducts);
router.get('/catalogo', productApiController.getCatalogo);
router.get('/:id', productApiController.getProductById);

module.exports = router;
