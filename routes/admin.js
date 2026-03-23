const express = require('express');
const router = express.Router();
const adminController = require('../Controllers/admin');
const { verificarAutenticacao, verificarRole } = require('../middlewares/authMiddleware');

// Middleware de proteção global para este ficheiro
router.use(verificarAutenticacao, verificarRole(['administrador']));

router.get('/dashboard', adminController.exibirDashboard);
router.get('/exibirUtilizadores', adminController.listarUtilizadores);
router.get('/exibirUtilizadores/:id/detalhes', adminController.editarUser);
router.get('/pendentes', adminController.listarPendentes);

router.post('/aprovar/:id', adminController.aprovarSupermercado);
router.post('/rejeitar/:id', adminController.rejeitarSupermercado);

module.exports = router;