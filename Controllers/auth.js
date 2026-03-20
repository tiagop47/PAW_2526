const authService = require('../services/authService');
const { getDashboardUrl } = require('../middlewares/authMiddleware');

const exibirLogin = (req, res) => {
    res.render("loginRegisto/login", { errorMessage: null });
};

const exibirRegisto = (req, res) => {
    res.render("loginRegisto/registar", { 
        errorMessage: null, 
        siteKey: process.env.CAPTCHA_API_KEY 
    });
};

const registar = async (req, res) => {
    const siteKey = process.env.CAPTCHA_API_KEY;
    
    try {
        // 1. Validar Captcha
        await authService.verificarCaptcha(req.body["g-recaptcha-response"]);

        // 2. Tentar Registar
        await authService.registarUtilizador(req.body);

        res.redirect("/auth/login");
    } catch (err) {
        res.render("loginRegisto/registar", { 
            errorMessage: err.message, 
            siteKey,
            dados: req.body
        });
    }
};

const login = async (req, res) => {
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

const exibirRecuperarPassword = (req, res) => {
    res.render("loginRegisto/recuperarPassword");
};

const logout = (req, res) => {
    res.clearCookie('token');
    res.redirect('/auth/login');
};


module.exports = {
    exibirLogin,
    exibirRegisto,
    registar,
    login,
    exibirRecuperarPassword,
};