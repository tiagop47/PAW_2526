const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');

// Proteger todas as rotas do cliente
router.use(authMiddleware.verificarAutenticacao, authMiddleware.verificarRole(['clientes']));

// Dashboard do Cliente
router.get('/dashboard', (req, res) => {
    res.render('cliente/dashboard');
});

module.exports = router;
