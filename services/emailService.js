const nodemailer = require('nodemailer');
const config = require('../config/config');

const emailService = {};

/**
 * Cria o transportador de email (Mailgun ou Ethereal)
 */
const criarTransporter = async () => {
    if (config.EMAIL_USER && config.EMAIL_PASS) {
        return nodemailer.createTransport({
            host: config.EMAIL_HOST,
            port: config.EMAIL_PORT,
            secure: config.EMAIL_PORT === 465,
            auth: {
                user: config.EMAIL_USER,
                pass: config.EMAIL_PASS
            }
        });
    }

    // Fallback para Ethereal (Desenvolvimento)
    const testAccount = await nodemailer.createTestAccount();
    console.warn("AVISO: A usar Ethereal para testes. Link de visualização no terminal.");
    return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass }
    });
};

/**
 * Envia o email de recuperação de password
 */
emailService.enviarEmailRecuperacao = async (email, token, host) => {
    const transporter = await criarTransporter();
    const link = `http://${host}/auth/reset-password/${token}`;

    const info = await transporter.sendMail({
        from: `"Suporte PAW" <${config.EMAIL_USER || 'suporte@paw.com'}>`,
        to: email,
        subject: "Recuperação de Palavra-passe",
        text: `Olá! Pediste para redefinir a tua password. Clica no link para continuar: ${link}`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #007bff; text-align: center;">Recuperação de Password</h2>
                <p>Olá,</p>
                <p>Recebemos um pedido para redefinir a password da tua conta.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${link}" style="display: inline-block; background-color: #007bff; color: #ffffff !important; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Redefinir Password</a>
                </div>
                <p style="font-size: 0.9rem; color: #666;">Se o botão acima não funcionar, copia e cola o seguinte link no teu navegador:</p>
                <p style="font-size: 0.8rem; word-break: break-all; color: #007bff;">${link}</p>
                <p style="font-size: 0.9rem; color: #666;">Se não pediste esta alteração, podes ignorar este email com segurança.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 0.8rem; color: #999; text-align: center;">Equipa PAW 2026</p>
            </div>
        `
    });

    if (!config.EMAIL_USER) {
        console.log("Clica aqui para ver o email:");
        console.log(nodemailer.getTestMessageUrl(info));
        console.log("-----------------------------------------");
    } else {
        console.log("Email real enviado para %s via Mailgun", email);
    }

    return info;
};

module.exports = emailService;