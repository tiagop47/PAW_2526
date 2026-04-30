const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { User } = require('../../models/UserModel');
const authMiddleware = require('../../middlewares/authMiddleware');
const userApiController = require('../../controllers/api/userApiController');

router.use(authMiddleware.verificarAutenticacao);

// Middleware para validar ID e carregar o utilizador automaticamente
router.param('id', async (req, res, next, id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ sucesso: false, erro: 'ID de utilizador inválido' });
    }

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ sucesso: false, erro: 'Utilizador não encontrado.' });
        }
        req.userPerfil = user;
        next();
    } catch (err) {
        next(err);
    }
});

router.get('/stats', userApiController.obterEstatisticas);
router.get('/cupoes', userApiController.meusCupoes);
router.patch('/:id', userApiController.atualizarPerfil);

module.exports = router;
