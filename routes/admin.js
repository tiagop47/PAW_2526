const express = require('express');
const router = express.Router();
const adminController = require('../Controllers/admin');
const { verificarAutenticacao, verificarRole } = require('../middlewares/authMiddleware');

// Middleware de proteção global para este ficheiro
router.use(verificarAutenticacao, verificarRole(['administrador']));

router.get('/dashboard', adminController.exibirDashboard);
router.get('/exibirUtilizadores', adminController.listarUtilizadores);
router.get('/estafetas', adminController.listarEstafetas);
router.get('/exibirUtilizadores/:id/detalhes', adminController.editarUser);
router.post('/exibirUtilizadores/:id/editar', adminController.guardarUser);

router.get('/listarMercados', adminController.listarSupermercados);
router.get('/supermercados/ativos', adminController.listarSupermercados);
router.get('/pendentes', adminController.listarPendentes);
router.get('/supermercados/pendentes', adminController.listarPendentes);

router.post('/aprovar/:id', adminController.aprovarSupermercado);
router.post('/rejeitar/:id', adminController.rejeitarSupermercado);
router.post('/supermercados/aprovar/:id', adminController.aprovarSupermercado);
router.post('/supermercados/rejeitar/:id', adminController.rejeitarSupermercado);
router.post('/bloquearSupermercado/:id', adminController.bloquearSupermercado);
router.post('/supermercados/bloquear/:id', adminController.bloquearSupermercado);

module.exports = router;
