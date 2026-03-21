const express = require('express');
const router = express.Router();
const authController = require('../Controllers/auth');

/**
 * Rotas GET (Exibição de páginas)
 */
router.get('/login', authController.exibirLogin);
router.get('/registar', authController.exibirRegisto);
router.get('/recuperarPassword', authController.exibirRecuperarPassword);
router.get('/logout', authController.logout);

/**
 * Rotas POST (Processamento de dados)
 */
router.post('/registar', authController.registar);
router.post('/login', authController.login);

module.exports = router;
