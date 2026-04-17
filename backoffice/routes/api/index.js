const express = require('express');
const router = express.Router();

const productRoutes = require('./productRoutes');
const supermercadosRoutes = require('./supermercadosRoutes');
const authRoutes = require('./authRoutes');

router.use('/products', productRoutes);
router.use('/supermercados', supermercadosRoutes);
router.use('/auth', authRoutes);

module.exports = router;
