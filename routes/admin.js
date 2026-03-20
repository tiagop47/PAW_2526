const express = require('express');
const router = express.Router();
const { verificarAutenticacao, verificarRole } = require('../middlewares/authMiddleware');

// Proteger todas as rotas do admin
router.use(verificarAutenticacao);
router.use(verificarRole(['admin']));

// Dashboard do Admin
router.get('/dashboard', (req, res) => {
    res.render('admin/dashboard', { user: req.user });
});

module.exports = router;