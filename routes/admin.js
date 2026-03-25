const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin');
const authMiddleware = require('../middlewares/authMiddleware');
const adminService = require('../services/adminService');

// Middleware de proteção global para este ficheiro
router.use(authMiddleware.verificarAutenticacao, authMiddleware.verificarRole(['administrador']));

router.get('/dashboard', adminController.exibirDashboard);
router.get('/exibirUtilizadores', adminController.listarUtilizadores);
router.get('/estafetas', adminController.listarEstafetas);

// Rotas de Utilizador (Usando :userId)
router.get('/exibirUtilizadores/:userId/detalhes', adminController.editarUser);
router.post('/exibirUtilizadores/:userId/editar', adminController.guardarUser);

// Rotas de Supermercado
router.get('/supermercados/ativos', adminController.listarSupermercados);
router.get('/supermercados/pendentes', adminController.listarPendentes);
router.post('/supermercados/aprovar/:supermarketId', adminController.aprovarSupermercado);
router.post('/supermercados/rejeitar/:supermarketId', adminController.rejeitarSupermercado);

/**
 * Middleware de Parâmetro: Carrega o utilizador se :userId estiver presente no URL.
 */
router.param('userId', async (req, res, next, id) => {
    try {
        const user = await adminService.getUserByIdSemPassword(id);
        if (!user) {
            return res.status(404).send('Utilizador não encontrado');
        }
        req.targetUser = user;
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = router;
