const express = require('express');
const router = express.Router();

// Redirecionamento da raiz do Backoffice para o Login
router.get('/', (req, res) => res.redirect('/auth/login'));

// Agrupamento das rotas backoffice (Server-Side Rendering)
router.use('/auth', require('./auth'));
router.use('/admin', require('./admin'));
router.use('/supermercado', require('./supermercado'));
router.use('/cliente', require('./cliente'));
router.use('/estafeta', require('./estafeta'));

module.exports = router;
