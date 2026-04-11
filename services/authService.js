const User = require('../models/UserModel');
const Supermarket = require('../models/SupermarketModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
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

    //Isto gera um código seguro de 20 letras/números
    const token = crypto.randomBytes(20).toString('hex');

    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;

    await user.save();
    return { user, token };
}


authService.enviarEmailRecuperacao = async function (email, token, req) {
    let transporter;

    if (config.EMAIL_USER && config.EMAIL_PASS) {
        transporter = nodemailer.createTransport({
            host: config.EMAIL_HOST,
            port: config.EMAIL_PORT,
            secure: config.EMAIL_PORT === 465,
            auth: {
                user: config.EMAIL_USER,
                pass: config.EMAIL_PASS
            }
        });
    } else {
        // Fallback para desenvolvimento (Ethereal)
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: { user: testAccount.user, pass: testAccount.pass }
        });
        console.warn("AVISO: A enviar via Ethereal. Configura EMAIL_USER e EMAIL_PASS no .env para enviar emails reais.");
    }

    const link = `http://${req.headers.host}/auth/reset-password/${token}`;
    try {
        const info = await transporter.sendMail({
            from: `"Suporte PAW" <${config.EMAIL_USER || 'suporte@paw.com'}>`,
            to: email,
            subject: "Recuperação de Palavra-passe",
            text: `Olá! Pediste para redefinir a tua password. Clica no link para continuar: ${link}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #007bff; text-align: center;">Recuperação de Password</h2>
                    <p>Recebemos um pedido para redefinir a password da tua conta.</p>
                    <p style="font-size: 0.8rem; word-break: break-all; color: #007bff;">${link}</p>
                    <p style="font-size: 0.9rem; color: #666;">Se não pediste esta alteração, podes ignorar este email com segurança.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 0.8rem; color: #999; text-align: center;">Equipa PAW 2026</p>
                </div>
            `
        });

        if (!config.EMAIL_USER) {
            console.log("EMAIL DE TESTE (ETHEREAL) ENVIADO!");
            console.log("Clica aqui para ver o email:");
            console.log(nodemailer.getTestMessageUrl(info));
        } else {
            console.log("Email real enviado para %s via Mailgun", email);
        }
    } catch (error) {
        console.error("ERRO AO ENVIAR EMAIL REAL:");
        console.error("Mensagem: %s", error.message);
        if (error.response) {
            console.error("Resposta do Mailgun: %s", error.response);
        }

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
