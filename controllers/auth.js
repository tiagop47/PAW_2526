const authService = require('../services/authService');
const { getDashboardUrl } = require('../middlewares/authMiddleware');

var authController = {};

authController.exibirLogin = function (req, res) {
    res.render("loginRegisto/login", { errorMessage: null });
};

authController.exibirRegisto = function (req, res) {
    res.render("loginRegisto/registar", {
        errorMessage: null,
        siteKey: process.env.CAPTCHA_API_KEY, // Enviar chave pública
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
            siteKey: process.env.CAPTCHA_API_KEY,
            dados: req.body
        });
    }
};

authController.login = async function (req, res) {
    try {
        const { email, password } = req.body;
        const { token, role } = await authService.autenticarUtilizador(email, password);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000
        });

        res.redirect(getDashboardUrl(role));
    } catch (err) {
        res.render("loginRegisto/login", { errorMessage: err.message });
    }
};

authController.exibirRecuperarPassword = (req, res) => {
    res.render("loginRegisto/recuperarPassword");
};

authController.logout = function (req, res) {
    res.clearCookie('token');
    res.redirect('/auth/login');
};

module.exports = authController;
