const User = require('../models/UserModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validarRegisto, rolesPublicas } = require('../utils/userValidator');

/**
 * Valida o reCAPTCHA com a Google.
 */
const verificarCaptcha = async (recaptchaResponse) => {
    if (!recaptchaResponse) throw new Error("Erro de segurança: Token não encontrado.");

    const secretKey = process.env.CAPTCHA_API_SECRET;
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaResponse}`;

    const googleResponse = await fetch(verifyUrl, { method: "POST" });
    const googleData = await googleResponse.json();
    const minScore = parseFloat(process.env.CAPTCHA_MIN_SCORE);

    if (!googleData.success || googleData.score < minScore) {
        throw new Error("Registo bloqueado por suspeita de atividade automatizada.");
    }
    return true;
};

/**
 * Lógica de registo de novo utilizador.
 */
const registarUtilizador = async (userData) => {
    const { nome, email, password, telefone, morada, role } = userData;

    const roleFinal = rolesPublicas.includes(role) ? role : "clientes";

    // Validação de formato (usando o teu util)
    const erroValidacao = validarRegisto({ nome, email, password, morada, telefone, role: roleFinal });
    if (erroValidacao) throw new Error(erroValidacao);

    // Verificar se existe
    const userExistente = await User.findOne({ email });
    if (userExistente) throw new Error("Este email já está registado.");

    // Hash da password
    const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const novoUser = new User({
        nome, email, password: hashedPassword, telefone, morada, role: roleFinal
    });

    return await novoUser.save();
};

/**
 * Lógica de autenticação e geração de Token.
 */
const autenticarUtilizador = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error("Credenciais inválidas.");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("Credenciais inválidas.");

    const secret = process.env.JWT_SECRET || 'fallback';
    const token = jwt.sign(
        { id: user._id, role: user.role, nome: user.nome },
        secret,
        { expiresIn: 86400 }
    );

    return { token, role: user.role };
};

module.exports = {
    verificarCaptcha,
    registarUtilizador,
    autenticarUtilizador
};