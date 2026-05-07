const express = require('express');
const router = express.Router();
const authController = require('../../controllers/api/authController');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Gestão de autenticação e utilizadores
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Autentica um utilizador
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login bem sucedido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       401:
 *         description: Credenciais inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/auth/registar:
 *   post:
 *     summary: Regista um novo cliente
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - email
 *               - password
 *               - nif
 *               - telefone
 *               - morada
 *             properties:
 *               nome:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               nif:
 *                 type: string
 *               telefone:
 *                 type: string
 *               morada:
 *                 type: string
 *               supermercadoFavorito:
 *                 type: string
 *                 description: ID do supermercado favorito (opcional)
 *     responses:
 *       201:
 *         description: Cliente registado com sucesso
 *       400:
 *         description: Erro na validação dos dados
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/registar', authController.registar);

/**
 * @swagger
 * /api/auth/cliente:
 *   get:
 *     summary: Procura um cliente pelo email
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: Email do cliente
 *     responses:
 *       200:
 *         description: Cliente encontrado
 *       400:
 *         description: Email é obrigatório
 *       403:
 *         description: Utilizador não é um cliente
 *       404:
 *         description: Utilizador não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/cliente', authController.buscarClientePorEmail);

module.exports = router;
