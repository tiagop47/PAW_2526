const User = require('../models/UserModel');
const { validarRegisto } = require('../utils/userValidator');
const { getDashboardUrl } = require('../middlewares/authMiddleware');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

/**
 * Exibe o formulário de login.
 */
const exibirLogin = (req, res) => {
    res.render("loginRegisto/login", {
        errorMessage: null,
    });
};

/**
 * Exibe o formulário de registo.
 */
const exibirRegisto = (req, res) => {
    res.render("loginRegisto/registar", {
        errorMessage: null,
        siteKey: process.env.CAPTCHA_API_KEY,
    });
};

/**
 * Processa o registo de um novo utilizador (Create).
 */
const registar = async (req, res) => {
    const { nome, email, password, telefone, morada, role } = req.body;

    const recaptchaResponse = req.body["g-recaptcha-response"];
    const siteKey = process.env.CAPTCHA_API_KEY;

    if (!recaptchaResponse) {
        return res.render("loginRegisto/registar", {
            errorMessage: "Erro de segurança: Token não encontrado.",
            siteKey: siteKey,
        });
    }

    const secretKey = process.env.CAPTCHA_API_SECRET;
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaResponse}`;

    try {
        const googleResponse = await fetch(verifyUrl, { method: "POST" });
        const googleData = await googleResponse.json();

        const minScore = parseFloat(process.env.CAPTCHA_MIN_SCORE);

        if (!googleData.success || googleData.score < minScore) {
            return res.render("loginRegisto/registar", {
                errorMessage:
                    "Registo bloqueado por suspeita de atividade automatizada.",
                siteKey: siteKey,
            });
        }
    } catch (error) {
        console.error("Erro ao validar reCAPTCHA:", error);
        return res.render("loginRegisto/registar", {
            errorMessage: "Erro de comunicação com o servidor de segurança.",
            siteKey: siteKey,
        });
    }

    let roleFinal = role;
    const rolesPublicas = ["clientes", "supermercados", "estafetas"];
    if (!rolesPublicas.includes(role)) {
        roleFinal = "clientes";
    }

    const erroValidacao = validarRegisto({ nome, email, password, morada, telefone, role: roleFinal });
    if (erroValidacao) {
        return res.render("loginRegisto/registar", {
            errorMessage: erroValidacao,
            siteKey: siteKey,
        });
    }

    try {
        const userExistente = await User.findOne({ email });
        if (userExistente) {
            return res.render("loginRegisto/registar", {
                errorMessage: "Este email já está registado.",
                siteKey: siteKey,
            });
        }

        const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const novoUser = new User({
            nome,
            email,
            password: hashedPassword,
            telefone,
            morada,
            role: roleFinal
        });
        await novoUser.save();

        res.redirect("/auth/login");
    } catch (err) {
        console.error("Erro no registo:", err);
        res.render("loginRegisto/registar", {
            errorMessage: "Ocorreu um erro inesperado.",
            siteKey: siteKey,
        });
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
                errorMessage: "Credenciais inválidas.",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render("loginRegisto/login", {
                errorMessage: "Credenciais inválidas.",
                successMessage: null
            });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role, nome: user.nome }, process.env.JWT_SECRET, {
            expiresIn: '86400'
        });

        res.cookie('token', token, {
            httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 // 24 horas
        });

        return res.redirect(getDashboardUrl(user.role));
    } catch (err) {
        console.error("Erro no login:", err);
        res.render("loginRegisto/login", {
            errorMessage: "Erro ao processar o pedido.",
        });
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
