const express = require('express');
const router = express.Router();

const productRoutes = require('./productRoutes');
const supermercadosRoutes = require('./supermercadosRoutes');
const authRoutes = require('./authRoutes');
const avaliacaoRoutes = require('./avaliacaoRoutes');
const estafetaApiRoutes = require('./estafetaApiRoutes');

router.use('/products', productRoutes);
router.use('/supermercados', supermercadosRoutes);
router.use('/auth', authRoutes);
router.use('/avaliacoes', avaliacaoRoutes);
router.use('/estafeta', estafetaApiRoutes);

module.exports = router;
