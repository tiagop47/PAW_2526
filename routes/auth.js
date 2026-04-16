const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * Rotas GET (Exibição de páginas)
 */
router.get('/login', authMiddleware.redirecionarLogged, authController.exibirLogin);
router.get('/registar', authMiddleware.redirecionarLogged, authController.exibirRegisto);
router.get('/recuperarPassword', authController.exibirRecuperarPassword);
router.get('/logout', authController.logout);
router.get('/reset-password/:token', authController.exibirResetPassword);

/**
 * Rotas POST (Processamento de dados)
 */
router.post('/registar', authController.registar);
router.post('/login', authController.login);
router.post('/recuperarPassword', authController.processarRecuperarPassword);
router.post('/reset-password/:token', authController.processarResetPassword);

module.exports = router;
