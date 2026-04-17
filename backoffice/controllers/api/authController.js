const authService = require('../../services/authService');
const User = require('../../models/UserModel');

const authController = {};

authController.login = async function (req, res) {
    try {
        const { email, password } = req.body;
        const { token, role, user } = await authService.autenticarUtilizador(email, password);

        if (role !== 'clientes') {
            return res.status(403).json({ error: "Acesso reservado apenas a clientes." });
        }

        res.json({ token, user });
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
};

authController.registar = async function (req, res) {
    try {
        const { nome, email, password, nif, telefone, morada } = req.body;
        const dadosCliente = { nome, email, password, nif, telefone, morada, role: "clientes" };
        await authService.registarUtilizador(dadosCliente);

        res.status(201).json({ message: "Cliente registado com sucesso" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

/**
 * Procura um cliente pelo email.
 * Apenas devolve se for um 'cliente'.
 */
authController.buscarClientePorEmail = async function (req, res) {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ error: 'Email é obrigatório' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({ error: 'Utilizador não encontrado' });
        }

        if (user.role !== 'clientes') {
            return res.status(403).json({ error: 'Este utilizador não é um cliente.' });
        }

        res.json({
            nome: user.nome,
            email: user.email,
            nif: user.nif,
            telefone: user.telefone,
            morada: user.morada
        });
    } catch (error) {
        console.error('Erro ao buscar cliente:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

module.exports = authController;
