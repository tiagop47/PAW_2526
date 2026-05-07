const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../../models/UserModel');
const authMiddleware = require('../../middlewares/authMiddleware');
const userApiController = require('../../controllers/api/userApiController');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestão de perfil e dados do utilizador
 */

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

/**
 * @swagger
 * /api/users/stats:
 *   get:
 *     summary: Obtém estatísticas do cliente autenticado (gastos, total encomendas, etc)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas do utilizador
 *       500:
 *         description: Erro no servidor
 */
router.get('/stats', userApiController.obterEstatisticas);

/**
 * @swagger
 * /api/users/cupoes:
 *   get:
 *     summary: Lista os cupões do cliente autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de cupões
 *       500:
 *         description: Erro no servidor
 */
router.get('/cupoes', userApiController.meusCupoes);

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Atualiza o perfil do utilizador
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               telefone:
 *                 type: string
 *               nif:
 *                 type: string
 *               morada:
 *                 type: string
 *               supermercadoFavorito:
 *                 type: string
 *     responses:
 *       200:
 *         description: Perfil atualizado
 *       400:
 *         description: Erro na atualização
 *       403:
 *         description: Sem permissão para editar este perfil
 */
router.patch('/:id', userApiController.atualizarPerfil);

module.exports = router;
