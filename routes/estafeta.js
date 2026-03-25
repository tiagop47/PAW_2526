const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const estafetaController = require('../controllers/estafeta');

// Proteger todas as rotas do estafeta
router.use(authMiddleware.verificarAutenticacao, authMiddleware.verificarRole(['estafetas']));

// Dashboard do Estafeta
router.get('/dashboard', estafetaController.exibirDashboard);

// Páginas de entregas
router.get('/entregas', estafetaController.listarEntregasDisponiveis);
router.get('/minhas-entregas', estafetaController.listarMinhasEntregas);

// API para entregas
router.get('/api/entregas', estafetaController.obterEntregasAPI);
router.get('/api/supermercados', estafetaController.obterSupermercadosAPI);
router.post('/api/entregas/:id/aceitar', estafetaController.aceitarEntrega);
router.post('/api/entregas/:id/confirmar', estafetaController.confirmarEntrega);

module.exports = router;
