const express = require('express');
const router = express.Router();
const authService = require('../../services/authService'); // Caminho correto para sair de api/ e da pasta routes/

router.post('/login', async (req, res) => {
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
});

router.post('/registar', async (req, res) => {
    try {
        // Assume req.body contains nome, email, password, nif, telefone, morada
        const dadosCliente = { ...req.body, role: "clientes" }; 
        await authService.registarUtilizador(dadosCliente);
        
        res.status(201).json({ message: "Cliente registado com sucesso" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
