const express = require('express');
const router = express.Router();

const productRoutes = require('./productRoutes');
const supermercadosRoutes = require('./supermercadosRoutes');
const authRoutes = require('./authRoutes');
const avaliacaoRoutes = require('./avaliacaoRoutes');
const estafetaApiRoutes = require('./estafetaApiRoutes');
const orderRoutes = require('./orderRoutes');
const userRoutes = require('./userRoutes');
const reclamacaoRoutes = require('./reclamacaoRoutes');

router.use('/products', productRoutes);
router.use('/supermercados', supermercadosRoutes);
router.use('/auth', authRoutes);
router.use('/avaliacoes', avaliacaoRoutes);
router.use('/estafeta', estafetaApiRoutes);
router.use('/orders', orderRoutes);
router.use('/users', userRoutes);
router.use('/reclamacoes', reclamacaoRoutes);

module.exports = router;
