const User = require('../models/UserModel');
const Supermarket = require('../models/SupermarketModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validarRegisto, rolesPublicas } = require('../utils/userValidator');
const geoService = require('./geoService');

const authService = {};

authService.verificarCaptcha = async function(recaptchaResponse) {
    if (!recaptchaResponse) throw new Error("Erro de segurança: Token não encontrado.");

    const secretKey = process.env.CAPTCHA_API_SECRET;
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaResponse}`;

    const googleResponse = await fetch(verifyUrl, { method: "POST" });
    const googleData = await googleResponse.json();
    const minScore = parseFloat(process.env.CAPTCHA_MIN_SCORE) || 0.5;

    if (!googleData.success || googleData.score < minScore) {
        throw new Error("Registo bloqueado por suspeita de atividade automatizada.");
    }
    return true;
};

authService.registarUtilizador = async function(userData) {
    const {
        nome, email, password, telefone, morada, role,
        localizacao, latitude, longitude, horario, custoEntrega, raioAtuacao, descricaoLoja, metodosEntrega
    } = userData;

    const roleFinal = rolesPublicas.includes(role) ? role : "clientes";

    const erroValidacao = validarRegisto({ nome, email, password, morada, telefone, role: roleFinal });
    if (erroValidacao) {
        throw new Error(erroValidacao);
    }

    const userExistente = await User.findOne({ email });
    if (userExistente) {
        throw new Error("Este email já está registado.");
    }

    const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const novoUser = new User({
        nome, email, password: hashedPassword, telefone, morada, role: roleFinal
    });

    const userGuardado = await novoUser.save();

    if (roleFinal === 'supermercados') {
        if (!latitude || !longitude) {
            throw new Error("É obrigatório selecionar a localização da loja no mapa.");
        }

        const coordenadas = { 
            type: 'Point', 
            coordinates: [parseFloat(longitude), parseFloat(latitude)] 
        };

        // Obter um nome legível para a localização via coordenadas (Reverse Geocoding)
        let nomeLocalizacao = "Definido por Coordenadas";
        const moradaReversa = await geoService.reverseGeocode(latitude, longitude);
        if (moradaReversa) nomeLocalizacao = moradaReversa;

        const metodos = Array.isArray(metodosEntrega) ? metodosEntrega : (metodosEntrega ? [metodosEntrega] : ['levantamento em loja']);

        await Supermarket.create({
            userId: userGuardado._id,
            nome: nome,
            localizacao: nomeLocalizacao,
            localizacaoGeo: coordenadas,
            horarioFuncionamento: horario || "09:00 - 19:00",
            custoEntrega: custoEntrega || 0,
            raioAtuacao: raioAtuacao || 5,
            metodosEntrega: metodos,
            descricao: descricaoLoja || "",
            estadoAprovacao: 'Pendente'
        });
    }

    return userGuardado;
};

authService.autenticarUtilizador = async function(email, password) {
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

module.exports = authService;
