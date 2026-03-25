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

/**
 * Rotas POST (Processamento de dados)
 */
router.post('/registar', authController.registar);
router.post('/login', authController.login);

module.exports = router;
