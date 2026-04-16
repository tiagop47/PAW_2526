const express = require('express');
const router = express.Router();

const supermercadoApiController = require('../../controllers/api/supermercadoApiController');

router.get('/', supermercadoApiController.getSupermercados);

module.exports = router;

