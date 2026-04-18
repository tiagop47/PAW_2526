const authService = require('../services/authService');
const config = require('../config/config');
const { getDashboardUrl } = require('../middlewares/authMiddleware');
const { rolesBackoffice } = require('../public/javascript/userValidator');

authService.inicializarAdmin().catch(err => console.error('Erro ao inicializar admin:', err));

var authController = {};

authController.exibirLogin = function (req, res) {
    res.render("loginRegisto/login", { errorMessage: null });
};

authController.exibirRegisto = function (req, res) {
    res.render("loginRegisto/registar", {
        errorMessage: null,
        siteKey: config.CAPTCHA_API_KEY, 
        dados: {}
    });
};

authController.registar = async function (req, res) {
    try {
        await authService.verificarCaptcha(req.body["g-recaptcha-response"]);
        await authService.registarUtilizador(req.body);

        res.redirect("/auth/login");
    } catch (err) {
        res.render("loginRegisto/registar", {
            errorMessage: err.message,
            siteKey: config.CAPTCHA_API_KEY,
            dados: req.body
        });
    }
};

authController.login = async function (req, res, next) {
    try {
        const { email, password } = req.body;
        const { token, role } = await authService.autenticarUtilizador(email, password);

        if (!rolesBackoffice.includes(role)) {
            const err = new Error('Acesso Negado');
            err.status = 403;
            err.tituloErro = 'Acesso Negado';
            err.detalheErro = 'Esta plataforma é reservada a administradores, supermercados e estafetas.';
            return next(err);
        }

        res.cookie('token', token, {
            httpOnly: true,
            secure: config.IS_PRODUCTION,
            maxAge: 24 * 60 * 60 * 1000
        });

        res.redirect(getDashboardUrl(role));
    } catch (err) {
        res.render("loginRegisto/login", { errorMessage: err.message });
    }
};

authController.exibirRecuperarPassword = function (req, res) {
    res.render("loginRegisto/recuperarPassword");
};

authController.logout = function (req, res) {
    res.clearCookie('token');
    res.redirect('/auth/login');
};

authController.processarRecuperarPassword = async function (req, res) {
    try {
        const { email } = req.body;

        const token = await authService.gerarTokenRecuperacao(email);
        await authService.enviarEmailRecuperacao(email, token, req.headers.host);

        res.render("loginRegisto/recuperarPassword", {
            successMessage: `Foi enviado um email para ${email} com as instruções.`,
            errorMessage: null
        });
    } catch (err) {
        res.render("loginRegisto/recuperarPassword", {
            errorMessage: err.message,
            successMessage: null
        });
    }
}

authController.exibirResetPassword = function (req, res) {
    res.render("loginRegisto/resetPassword", {
        token: req.params.token,
        errorMessage: null
    });
};

authController.processarResetPassword = async function (req, res) {
    try {
        const { password, confirmPassword } = req.body;
        const { token } = req.params;

        if (password !== confirmPassword) {
            throw new Error("As palavras-passe não coincidem.");
        }

        await authService.redefinirPassword(token, password);

        res.render("loginRegisto/login", {
            errorMessage: null,
            successMessage: "Palavra-passe alterada com sucesso! Já podes iniciar sessão."
        });
    } catch (err) {
        res.render("loginRegisto/resetPassword", {
            token: req.params.token,
            errorMessage: err.message
        });
    }
};

module.exports = authController;
