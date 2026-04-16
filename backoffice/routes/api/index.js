const express = require('express');
const router = express.Router();

const productRoutes = require('./productRoutes');
const supermercadosRoutes = require('./supermercadosRoutes');

router.use('/products', productRoutes);
router.use('/supermercados', supermercadosRoutes);

module.exports = router;
