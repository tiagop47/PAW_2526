const mongoose = require('mongoose');
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

async function criarSupermercado(userId, { nome, localizacao, morada, latitude, longitude, horario, custoEntregaPorMetodo, descricaoLoja }) {
    const coordenadas = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
    };

    return Supermarket.create({
        userId,
        nome,
        localizacao: localizacao || morada || "Localização Manual",
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
    const { nome, email, password, nif, telefone, morada, role, supermercadoFavorito, onlyUser, supermarketId } = userData;
    const roleFinal = rolesPublicas.includes(role) ? role : 'clientes';

    if (roleFinal === 'supermercados' && !onlyUser) {
        if (!userData.latitude || !userData.longitude) {
            throw new Error("É obrigatório selecionar a localização da loja no mapa.");
        }
        if (!userData.localizacao || userData.localizacao.trim() === "") {
            throw new Error("É obrigatório selecionar um concelho para o supermercado.");
        }
    }

    const novoUser = new User({ nome, email, password, nif, telefone, morada, role: roleFinal, supermercadoFavorito });
    const userGuardado = await novoUser.save();

    let dadosBoasVindas = null;
    if (roleFinal === 'clientes') {
        dadosBoasVindas = await atribuirCupoesCliente(userGuardado);
    }

    if (roleFinal === 'clientes' && dadosBoasVindas) {
        try {
            await emailService.enviarEmailBoasVindas(email, nome, dadosBoasVindas.codigo, dadosBoasVindas.nomeSupermercado);
        } catch (e) {
            console.error("Erro ao enviar email de boas-vindas", e.message);
        }
    }

    if (roleFinal === 'supermercados') {
        if (onlyUser && supermarketId) {
            // Se estamos apenas a criar o utilizador para um supermercado existente
            await Supermarket.findByIdAndUpdate(supermarketId, { 
                userId: userGuardado._id,
                estadoAprovacao: 'Pendente' // Volta a pendente para aprovação do admin
            });
        } else {
            // Registo normal de novo supermercado
            await criarSupermercado(userGuardado._id, userData);
        }
    }

    return userGuardado;
};

authService.autenticarUtilizador = async function (email, password) {
    const user = await User.findOne({ email }).lean();
    if (!user) {
        throw new Error("Credenciais inválidas.");
    }

    if (user.bloqueado) {
        throw new Error("A sua conta está bloqueada");
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

    const { password: _hash, ...userSemPassword } = user;

    return { token, role: user.role, user: userSemPassword };
};

authService.autenticarCliente = async function (email, password) {
    const { token, role, user } = await authService.autenticarUtilizador(email, password);

    if (role !== 'clientes') {
        throw new Error('Acesso reservado apenas a clientes.');
    }

    return { token, user };
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

/**
 * Procura um utilizador pelo ID e remove a password do resultado.
 * Útil para perfis e dashboards.
 */
authService.getUserByIdSemPassword = async function (id) {
    return User.findById(id).select('-password');
};

async function atribuirCupoesCliente(user) {
    if (!user.supermercadoFavorito) return null;

    const supermercado = await Supermarket.findById(user.supermercadoFavorito);
    if (!supermercado) return null;

    const prazo30Dias = new Date();
    prazo30Dias.setDate(prazo30Dias.getDate() + 30);
    const codigoBoasVindas = 'WELCOME' + Math.floor(10000 + Math.random() * 90000);

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const [cupaoBoasVindas] = await Coupon.create([{
            codigo: codigoBoasVindas,
            tipoDesconto: 'percentagem',
            percentagemDesconto: 10,
            origem: 'boas_vindas',
            prazo: prazo30Dias,
            supermercadoId: user.supermercadoFavorito
        }], { session });

        await Supermarket.findByIdAndUpdate(user.supermercadoFavorito, { $push: { cupoes: cupaoBoasVindas._id } }, { session });
        await User.findByIdAndUpdate(user._id, { $push: { cupoes: cupaoBoasVindas._id } }, { session });

        await session.commitTransaction();
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }

    return { codigo: codigoBoasVindas, nomeSupermercado: supermercado.nome };
}

module.exports = authService;
