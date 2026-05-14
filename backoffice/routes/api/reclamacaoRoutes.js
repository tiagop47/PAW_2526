const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const reclamacaoApiController = require('../../controllers/api/reclamacaoApiController');

router.use(authMiddleware.verificarAutenticacao);

router.get('/', authMiddleware.verificarRole(['clientes']), reclamacaoApiController.listarMinhas);
router.post('/', authMiddleware.verificarRole(['clientes']), reclamacaoApiController.criar);
router.get('/gestao', authMiddleware.verificarRole(['administrador', 'supermercados']), reclamacaoApiController.listarGestao);
router.patch('/:id/responder', authMiddleware.verificarRole(['administrador', 'supermercados']), reclamacaoApiController.responder);

module.exports = router;
