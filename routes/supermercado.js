const express = require('express');
const router = express.Router();
const supermarketController = require('../Controllers/supermercado');
const { verificarAutenticacao, verificarRole } = require('../middlewares/authMiddleware');

// Middleware de proteção global para este ficheiro
router.use(verificarAutenticacao, verificarRole(['supermercados']));

router.get('/dashboard', supermarketController.exibirDashboard);

module.exports = router;