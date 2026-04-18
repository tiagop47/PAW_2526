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
    const link = `http://${host}/auth/reset-password/${token}`;

    try {
        const transporter = await criarTransporter();
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
        } else {
            console.log("Email real enviado para %s", email);
        }
        return info;

    } catch (err) {
        console.log("LINK DE RECUPERAÇÃO PARA O UTILIZADOR (%s):", email);
        console.log(link);

        // Retornamos um objeto que simula sucesso para que o controlador não rebente
        return { messageId: 'fallback-console-id' };
    }
};

emailService.enviarEmailBoasVindas = async (email, nome, codigoCupao) => {
    try {
        const transporter = await criarTransporter();
        const info = await transporter.sendMail({
            from: `"Supermercados PAW" <${config.EMAIL_USER || 'geral@paw.com'}>`,
            to: email,
            subject: "Bem-vindo! Aqui tens o teu presente 🎁",
            text: `Olá ${nome}! Obrigado pelo teu registo. Tens 10% de desconto com o código: ${codigoCupao}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #007bff; text-align: center;">Bem-vindo, ${nome}!</h2>
                    <p>Ficamos muito felizes por te juntares a nós.</p>
                    <p>Como oferta especial de boas-vindas, oferecemos um cupão de 10% de desconto para usares na tua primeira compra:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="display: inline-block; background-color: #28a745; color: #ffffff; padding: 15px 30px; font-size: 1.5rem; font-weight: bold; border-radius: 5px; letter-spacing: 2px;">${codigoCupao}</span>
                    </div>
                    <p style="font-size: 0.9rem; color: #666;">Basta inserir este código no checkout. Válido para 1 utilização.</p>
                </div>
            `
        });

        if (!config.EMAIL_USER) {
            console.log("CUPÃO DE BOAS VINDAS ENVIADO PARA: ", email);
            console.log("CÓDIGO:", codigoCupao);
            console.log(nodemailer.getTestMessageUrl(info));
        }
        return info;
    } catch (err) {
        console.error("ERRO NO ENVIO DO EMAIL DE BOAS VINDAS:", err.message);
        return { messageId: 'fallback-console-id' };
    }
};

/**
* Envia o email de novo cupão para uma lista de utilizadores via BCC.
*/
emailService.enviarEmailNovoCupao = async (emails, dadosCupao) => {
    if (!emails || emails.length === 0) return;

    try {
        const transporter = await criarTransporter();
        const info = await transporter.sendMail({
            from: `"Promoções PAW" <${config.EMAIL_USER || 'promo@paw.com'}>`,
            to: config.EMAIL_USER || 'marketing@paw.com',
            bcc: emails,
            subject: `Novo Cupão Disponível: ${dadosCupao.codigo}`,
            text: `Olá! Temos um novo cupão para ti: ${dadosCupao.codigo}. Desconto de ${dadosCupao.desconto}%.`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #28a745; text-align: center;">🎉 Novo Desconto para Ti!</h2>
                    <p>Olá,</p>
                    <p>Temos o prazer de anunciar um novo cupão de desconto que já está disponível na tua conta!</p>
                    <div style="text-align: center; margin: 30px 0; background-color: #f8f9fa; padding: 20px; border-radius: 10px; border: 2px dashed #28a745;">
                        <h3 style="margin: 0; color: #333;">CÓDIGO: <span style="color: #28a745; font-size: 1.5rem;">${dadosCupao.codigo}</span></h3>
                        <p style="margin: 10px 0 0 0; font-weight: bold;">DESCONTO: ${dadosCupao.desconto}%</p>
                    </div>
                    <p style="font-size: 0.9rem; color: #666; text-align: center;">Aproveita já antes que expire!</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 0.8rem; color: #999; text-align: center;">Equipa PAW 2026</p>
                </div>
            `
        });

        console.log("Email de novo cupão enviado para %d destinatários.", emails.length);
        if (!config.EMAIL_USER) {
            console.log(nodemailer.getTestMessageUrl(info));
        }
        return info;
    } catch (err) {
        console.error("ERRO NO ENVIO DO EMAIL DE NOVO CUPÃO:", err.message);
        return { messageId: 'fallback-console-id' };
    }
};

module.exports = emailService;