const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/authMiddleware');
const userApiController = require('../../controllers/api/userApiController');

router.use(authMiddleware.verificarAutenticacao);

router.patch('/:id', userApiController.atualizarPerfil);

module.exports = router;
