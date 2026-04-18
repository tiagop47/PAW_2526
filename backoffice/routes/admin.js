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
router.post('/supermercados/bloquear/:supermarketId', adminController.bloquearSupermercado);
router.get('/supermercados/transferir/:supermarketId', adminController.exibirTransferirPropriedade);
router.post('/supermercados/transferir/:supermarketId', adminController.transferirPropriedade);
router.get('/supermercados/editar/:supermarketId', adminController.exibirEditarSupermercado);
router.post('/supermercados/editar/:supermarketId', adminController.editarSupermercado);
router.post('/utilizadores/:userId/eliminar', adminController.eliminarUser);
router.get('/utilizadores/:userId/editar', adminController.exibirEditarUser);
router.post('/utilizadores/:userId/editar', adminController.editarUser);

// Monitorização Global
router.get('/encomendas', adminController.monitorizarEncomendas);
router.get('/encomendas/:orderId/fatura', adminController.exibirFatura);

// Gestão de Categorias
router.get('/categorias', adminController.exibirCategorias);
router.post('/categorias', adminController.criarCategoria);
router.post('/categorias/eliminar/:categoriaId', adminController.eliminarCategoria);

//Gestão de Cupões
router.get('/cupoes', adminController.exibirCupoes);
router.post('/cupoes', adminController.criarCupao);
router.post('/cupoes/desativar/:cupaoId', adminController.desativarCupao);
router.post('/cupoes/ativar/:cupaoId', adminController.ativarCupao);
router.post('/cupoes/eliminar/:cupaoId', adminController.eliminarCupao);

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

router.param('supermarketId', async (req, res, next, id) => {
    try {
        const supermercado = await adminService.getSupermercadoById(id);
        if (!supermercado) {
            return res.status(404).send('Supermercado não encontrado.');
        }

        req.targetSupermercado = supermercado;
        next();
    } catch (err) {
        next(err);
    }
});

router.param('orderId', async (req, res, next, id) => {
    try {
        const encomenda = await adminService.getEncomendaPorId(id);
        if (!encomenda) {
            return res.status(404).send('Encomenda não encontrada.');
        }

        req.targetEncomenda = encomenda;

        next();
    } catch (err) {
        next(err);
    }
});

router.param('categoriaId', async (req, res, next, id) => {
    try {
        const categoria = await adminService.getCategoriaById(id);
        if (!categoria) {
            return res.status(404).send('Categoria não encontrada.');
        }

        req.targetCategoria = categoria;

        next();
    } catch (err) {
        next(err);
    }
});

module.exports = router;
