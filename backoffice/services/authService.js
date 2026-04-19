const User = require('../models/UserModel');
const Supermarket = require('../models/SupermarketModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { rolesPublicas } = require('../public/javascript/userValidator');
const config = require('../config/config');
const emailService = require('./emailService');
const Coupon = require('../models/CupomModel');

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

async function criarSupermercado(userId, { nome, morada, latitude, longitude, horario, custoEntregaPorMetodo, descricaoLoja }) {
    const coordenadas = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
    };

    return Supermarket.create({
        userId,
        nome,
        localizacao: morada || "Localização Manual",
        localizacaoGeo: coordenadas,
        horarioFuncionamento: horario || "09:00 - 19:00",
        custoEntregaPorMetodo: {
            levantamento_loja: custoEntregaPorMetodo?.levantamento_loja !== undefined ? (parseFloat(custoEntregaPorMetodo.levantamento_loja) || 0) : null,
            entrega_domicilio: custoEntregaPorMetodo?.entrega_domicilio !== undefined ? (parseFloat(custoEntregaPorMetodo.entrega_domicilio) || 0) : null
        },
        descricao: descricaoLoja || "",
        estadoAprovacao: 'Pendente'
    });
}

authService.registarUtilizador = async function (userData) {
    const { nome, email, password, nif, telefone, morada, role } = userData;
    const roleFinal = rolesPublicas.includes(role) ? role : 'clientes';

    if (roleFinal === 'supermercados' && (!userData.latitude || !userData.longitude)) {
        throw new Error("É obrigatório selecionar a localização da loja no mapa.");
    }

    const novoUser = new User({ nome, email, password, nif, telefone, morada, role: roleFinal });

    let codigoBoasVindas = null;
    if (roleFinal === 'clientes') {
        codigoBoasVindas = await atribuirCupoesCliente(novoUser, morada);
    }

    const userGuardado = await novoUser.save();

    if (roleFinal === 'clientes' && codigoBoasVindas) {
        try {
            await emailService.enviarEmailBoasVindas(email, nome, codigoBoasVindas);
        } catch (e) {
            console.error("Erro ao enviar email de boas-vindas", e.message);
        }
    }

    if (roleFinal === 'supermercados') {
        await criarSupermercado(userGuardado._id, userData);
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

    const userObj = user.toObject();
    delete userObj.password;

    return { token, role: user.role, user: userObj };
};

authService.inicializarAdmin = async function () {
    const totalUsers = await User.countDocuments();
    if (totalUsers > 0) {
        return;
    }

    const novoAdmin = new User({
        nome: "Administrador do Sistema",
        email: "admin@gmail.com",
        password: config.DEFAULT_ADMIN_PASSWORD,
        telefone: "999999999",
        nif: "999999999",
        morada: "Rua do Administrador, nº 1",
        role: "administrador"
    });

    await novoAdmin.save();
    console.log("Administrador por defeito criado.");
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
    return token;
}


authService.enviarEmailRecuperacao = async function (email, token, host) {
    try {
        await emailService.enviarEmailRecuperacao(email, token, host);
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

async function atribuirCupoesCliente(novoUser, morada) {

    const condicoes = [
        { localidadeAlvo: { $exists: false } },
        { localidadeAlvo: "" }
    ];
    if (morada) {
        condicoes.push({ localidadeAlvo: morada });
    }

    const cupoesValidos = await Coupon.find({ $or: condicoes });
    if (cupoesValidos.length > 0) {
        novoUser.cupoes = cupoesValidos.map(c => c._id);
    }

    const prazo30Dias = new Date();
    prazo30Dias.setDate(prazo30Dias.getDate() + 30);
    const codigoBoasVindas = 'WELCOME' + Math.floor(10000 + Math.random() * 90000);

    const cupaoBoasVindas = await Coupon.create({
        codigo: codigoBoasVindas,
        percentagemDesconto: 10,
        prazo: prazo30Dias
    });

    if (!novoUser.cupoes) {
        novoUser.cupoes = [];
    }

    novoUser.cupoes.push(cupaoBoasVindas._id);

    return codigoBoasVindas;
}

module.exports = authService;