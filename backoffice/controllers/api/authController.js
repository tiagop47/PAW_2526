const authService = require('../../services/authService');

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

module.exports = authController;
