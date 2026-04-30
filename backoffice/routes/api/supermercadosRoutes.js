const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Supermarket = require('../../models/SupermarketModel');
const supermercadoApiController = require('../../controllers/api/supermercadoApiController');

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

router.get('/', supermercadoApiController.getSupermercados);
router.get('/promocoes', supermercadoApiController.getPromocoes);
router.get('/categorias', supermercadoApiController.getCategorias);

router.get('/:id', supermercadoApiController.getSupermercadoById);
router.get('/:id/metodoPreco', supermercadoApiController.getMetodosCusto);
router.get('/:id/cupoes', supermercadoApiController.getCupoes);

module.exports = router;
