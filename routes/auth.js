const express = require('express');
const router = express.Router();
const User = require('../models/UserModel');

/**
 * Rota para exibir o formulário de login.
 */
router.get('/login', (req, res) => {
    res.render('loginRegisto/login', { errorMessage: null });
});

/**
 * Rota para exibir o formulário de registo.
 */
router.get("/registar", (req, res) => {
    res.render("loginRegisto/registar", { errorMessage: null });
});

/**
 * Rota para processar o registo de um novo utilizador.
 */
router.post("/registar", async (req, res) => {
    const { nome, email, password } = req.body;

    try {
        const userExistente = await User.findOne({ email });
        if (userExistente) {
            return res.render("loginRegisto/registar", {
                errorMessage: "Este email já está registado."
            });
        }

        const novoUser = new User({ nome, email, password });
        await novoUser.save();

        res.redirect("/auth/login");
    } catch (err) {
        console.error("Erro no registo:", err);
        res.render("loginRegisto/registar", {
            errorMessage: "Ocorreu um erro inesperado. Tente novamente."
        });
    }
});

/**
 * Rota para exibição da página de recuperação de palavra-passe.
 */
router.get("/recuperarPassword", (req, res) => {
    res.render("loginRegisto/recuperarPassword");
});

module.exports = router;
