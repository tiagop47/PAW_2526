const express = require('express');
const router = express.Router();
const { verificarAutenticacao, verificarRole } = require('../middlewares/authMiddleware');

// Proteger todas as rotas do cliente
router.use(verificarAutenticacao, verificarRole(['clientes']));

// Dashboard do Cliente
router.get('/dashboard', (req, res) => {
    res.render('cliente/dashboard');
});

module.exports = router;