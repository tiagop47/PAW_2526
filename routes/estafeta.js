const express = require('express');
const router = express.Router();
const { verificarAutenticacao, verificarRole } = require('../middlewares/authMiddleware');

// Proteger todas as rotas do estafeta
router.use(verificarAutenticacao, verificarRole(['estafetas']));

// Dashboard do Estafeta
router.get('/dashboard', (req, res) => {
    res.render('estafeta/dashboard');
});

module.exports = router;