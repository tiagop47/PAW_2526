const express = require('express');
const router = express.Router();
const authController = require('../../controllers/api/authController');

router.post('/login', authController.login);
router.post('/registar', authController.registar);

module.exports = router;
