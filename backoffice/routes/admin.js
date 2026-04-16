const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin');
const authMiddleware = require('../middlewares/authMiddleware');
const adminService = require('../services/adminService');

router.use(authMiddleware.verificarAutenticacao, authMiddleware.verificarRole(['administrador']));

router.get('/dashboard', adminController.exibirDashboard);
router.get('/exibirUtilizadores', adminController.listarUtilizadores);
router.get('/estafetas', adminController.listarEstafetas);
router.get('/supermercados/ativos', adminController.listarSupermercados);
router.get('/supermercados/pendentes', adminController.listarPendentes);
router.post('/supermercados/aprovar/:supermarketId', adminController.aprovarSupermercado);
router.post('/supermercados/rejeitar/:supermarketId', adminController.rejeitarSupermercado);
router.get('/supermercados/bloquear/:supermarketId', adminController.bloquearSupermercado);
router.get('/utilizadores/eliminar/:id', adminController.eliminarUser);

// Monitorização Global
router.get('/encomendas', adminController.monitorizarEncomendas);
router.get('/encomendas/:orderId/fatura', adminController.exibirFatura);

// Gestão de Categorias
router.get('/categorias', adminController.exibirCategorias);
router.post('/categorias', adminController.criarCategoria);
router.post('/categorias/eliminar/:id', adminController.eliminarCategoria);

/**
 * Middleware de Parâmetro: Carrega o utilizador quando :userId está no URL.
 */
router.param('userId', async (req, res, next, id) => {
    try {
        const user = await adminService.getUserByIdSemPassword(id);
        if (!user) {
            return res.status(404).send('Utilizador não encontrado.');
        }
        req.targetUser = user;
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = router;
