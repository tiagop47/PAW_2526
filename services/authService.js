const User = require('../models/UserModel');
const Supermarket = require('../models/SupermarketModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { rolesPublicas } = require('../public/javascript/userValidator');
const config = require('../config/config');

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

    const novoUser = new User({
        nome, email, password, nif, telefone, morada, role: roleFinal
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

    return { token, role: user.role };
};

authService.inicializarAdmin = async function () {
    try {
        const adminExistente = await User.findOne({ role: 'administrador' });

        if (!adminExistente) {
            console.log("Nenhum administrador encontrado. A criar conta de administrador por defeito...");

            const adminData = {
                nome: "Administrador do Sistema",
                email: "admin@admin.com",
                password: config.DEFAULT_ADMIN_PASSWORD,
                telefone: "999999999",
                nif: "999999999",
                morada: "Rua do Administrador, nº 1",
                role: "administrador"
            };
            const novoAdmin = new User(adminData);
            await novoAdmin.save();

            console.log("Administrador criado com sucesso!");
            console.log(`Email: admin@admin.com`);
            console.log(`Password: ${config.DEFAULT_ADMIN_PASSWORD}`);
        } else {
            console.log("Administrador ja existe na base de dados.");
        }
    } catch (error) {
        console.error("Erro ao inicializar administrador:", error.message);
    }
};

module.exports = authService;
