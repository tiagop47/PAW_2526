const User = require('../models/UserModel');
const Supermarket = require('../models/SupermarketModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { rolesPublicas } = require('../public/javascript/userValidator');
const config = require('../config/config');
const emailService = require('./emailService');
const UserDTO = require('../models/UserDTO');

const authService = {};

authService.verificarCaptcha = async function (recaptchaResponse) {
    if (!recaptchaResponse) throw new Error("Erro de segurança: Token não encontrado.");

    const secretKey = config.CAPTCHA_API_SECRET;
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaResponse}`;

    const googleResponse = await fetch(verifyUrl, { method: "POST" });
    const googleData = await googleResponse.json();

    if (!googleData.success) {
        throw new Error("Registo bloqueado: Falha na validação do reCAPTCHA.");
    }
    return true;
};

authService.registarUtilizador = async function (userData) {
    const {
        nome, email, password, nif, telefone, morada, role,
        latitude, longitude, horario, custoEntrega, raioAtuacao, descricaoLoja, metodosEntrega
    } = userData;

    const roleFinal = rolesPublicas.includes(role) ? role : "clientes";

    if (roleFinal === 'supermercados' && (!latitude || !longitude)) {
        throw new Error("É obrigatório selecionar a localização da loja no mapa.");
    }

    const novoUser = new User({
        nome, email, password, nif, telefone, morada, role: roleFinal
    });

    // Se for cliente, ganha automaticamente cupoes e enviamos um por email!
    if (roleFinal === 'clientes') {
        const Coupon = require('../models/cupomModel');

        const condicoes = [
            { localidadeAlvo: { $exists: false } },
            { localidadeAlvo: "" }
        ];
        if (morada) condicoes.push({ localidadeAlvo: { $regex: new RegExp(morada, 'i') } });

        const cupoesValidos = await Coupon.find({ $or: condicoes });

        if (cupoesValidos.length > 0) {
            novoUser.cupoes = cupoesValidos.map(c => c._id);
        }

        const codigoAleatorio = 'WELCOME' + Math.floor(10000 + Math.random() * 90000);
        const prazo30Dias = new Date();
        prazo30Dias.setDate(prazo30Dias.getDate() + 30);

        const cupaoBoasVindas = await Coupon.create({
            codigo: codigoAleatorio,
            percentagemDesconto: 10,
            prazo: prazo30Dias,
            limiteUtilizacoes: 1
        });

        if (!novoUser.cupoes) novoUser.cupoes = [];
        novoUser.cupoes.push(cupaoBoasVindas._id);

        novoUser._codigoBoasVindas = codigoAleatorio;
    }

    const userGuardado = await novoUser.save();

    if (roleFinal === 'clientes' && novoUser._codigoBoasVindas) {
        try {
            await emailService.enviarEmailBoasVindas(email, nome, novoUser._codigoBoasVindas);
        } catch (e) {
            console.error("Erro ao enviar email de boas-vindas", e.message);
        }
    }

    if (roleFinal === 'supermercados') {
        const coordenadas = {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
        };

        const metodos = Array.isArray(metodosEntrega) ? metodosEntrega : (metodosEntrega ? [metodosEntrega] : ['levantamento em loja']);

        await Supermarket.create({
            userId: userGuardado._id,
            nome: nome,
            localizacao: morada || "Localização Manual",
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

authService.autenticarUtilizador = async function (email, password) {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error("Credenciais inválidas.");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error("Credenciais inválidas.");
    }

    const secret = config.JWT_SECRET;
    const token = jwt.sign(
        { id: user._id, role: user.role, nome: user.nome },
        secret,
        { expiresIn: 86400 }
    );

    // Usa o Modelo de Data Transfer Object
    const userDTO = new UserDTO(user);

    return { token, role: user.role, user: userDTO };
};

authService.inicializarAdmin = async function () {
    try {
        const adminExistente = await User.findOne({ role: 'administrador' });

        if (!adminExistente) {
            console.log("Nenhum administrador encontrado. A criar conta de administrador por defeito...");

            const adminData = {
                nome: "Administrador do Sistema",
                email: "admin@gmail.com",
                password: config.DEFAULT_ADMIN_PASSWORD,
                telefone: "999999999",
                nif: "999999999",
                morada: "Rua do Administrador, nº 1",
                role: "administrador"
            };
            const novoAdmin = new User(adminData);
            await novoAdmin.save();

        } else {
            console.log("Administrador ja existe na base de dados.");
        }
    } catch (error) {
        console.error("Erro ao inicializar administrador:", error.message);
    }
};

authService.gerarTokenRecuperacao = async function (email) {

    const user = await User.findOne({ email });

    if (!user) {
        throw new Error("Não existe nenhuma conta com esse email.")
    }

    const token = crypto.randomBytes(20).toString('hex');

    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;

    await user.save();
    return { user, token };
}


authService.enviarEmailRecuperacao = async function (email, token, req) {
    try {
        await emailService.enviarEmailRecuperacao(email, token, req.headers.host);
    } catch (error) {
        console.error("ERRO AO ENVIAR EMAIL DE RECUPERAÇÃO:", error);
        throw new Error("Não foi possível enviar o email de recuperação. Por favor, tenta mais tarde.");
    }
};

authService.redefinirPassword = async function (token, novaPassword) {
    const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
        throw new Error("Este link de recuperação é inválido ou já expirou.");
    }

    user.password = novaPassword;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();
};

module.exports = authService;