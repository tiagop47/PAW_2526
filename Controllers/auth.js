const User = require('../models/UserModel');
const { validarRegisto } = require('../utils/userValidator');

/**
 * Exibe o formulário de login.
 */
const exibirLogin = (req, res) => {
    res.render('loginRegisto/login', { 
        errorMessage: null });
};

/**
 * Exibe o formulário de registo.
 */
const exibirRegisto = (req, res) => {
    res.render('loginRegisto/registar', { 
        errorMessage: null });
};

/**
 * Processa o registo de um novo utilizador (Create).
 */
const registar = async (req, res) => {
    const { nome, email, password, phoneNumber, age } = req.body;

    const erroValidacao = validarRegisto(nome, email, password);
    if (erroValidacao) {
        return res.render("loginRegisto/registar", {
            errorMessage: erroValidacao
        });
    }

    try {
        const userExistente = await User.findOne({ email });
        if (userExistente) {
            return res.render("loginRegisto/registar", { errorMessage: "Este email já está registado." });
        }

        const novoUser = new User({ nome, email, password, phoneNumber, age });
        await novoUser.save();

        res.redirect("/auth/login");
    } catch (err) {
        console.error("Erro no registo:", err);
        res.render("loginRegisto/registar", { 
            errorMessage: "Ocorreu um erro inesperado." });
    }
};

/**
 * Processa a autenticação do utilizador (FindOne).
 */
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.render("loginRegisto/login", { 
                errorMessage: "Credenciais inválidas." });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.render("loginRegisto/login", { 
                errorMessage: "Credenciais inválidas." });
        }

        res.send("Login efetuado com sucesso! Bem-vindo " + user.nome);
    } catch (err) {
        console.error("Erro no login:", err);
        res.render("loginRegisto/login", { 
            errorMessage: "Erro ao processar o pedido." });
    }
};

/**
 * Exibe a página de recuperação de password.
 */
const exibirRecuperarPassword = (req, res) => {
    res.render("loginRegisto/recuperarPassword");
};

module.exports = {
    exibirLogin,
    exibirRegisto,
    registar,
    login,
    exibirRecuperarPassword,
};
