const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');

const Category = require('../models/CategoryModel');

// Proteger todas as rotas do cliente
router.use(authMiddleware.verificarAutenticacao, authMiddleware.verificarRole(['clientes']));

// Dashboard do Cliente
router.get('/dashboard', async (req, res) => {
    try {
        const categorias = await Category.find().sort({ nome: 1 });
        res.render('cliente/dashboard', { categorias });
    } catch (err) {
        res.render('cliente/dashboard', { categorias: [] });
    }
});

module.exports = router;
