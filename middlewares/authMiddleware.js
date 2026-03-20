const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback';
const DASHBOARDS = {
    administrador: "/admin/dashboard",
    supermercados: "/supermercado/dashboard",
    estafetas: "/estafeta/dashboard",
    clientes: "/cliente/dashboard",
};

function getDashboardUrl(role) {
    return DASHBOARDS[role];
}

/**
 * Helper interno — descodifica o token JWT do cookie.
 * Retorna o payload do utilizador ou null.
 */
const descodificarToken = (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return null;
    }

    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        res.clearCookie('token');
        return null;
    }
};

/**
 * Middleware global — injeta `res.locals.user` em todas as views.
 * Deve ser usado uma vez no app.js (substitui o middleware inline).
 */
const injetarUserNasViews = (req, res, next) => {
    res.locals.user = descodificarToken(req, res);
    next();
};

/**
 * Middleware — bloqueia acesso se não estiver autenticado.
 * Reutiliza o res.locals.user já injetado pelo injetarUserNasViews.
 */
const verificarAutenticacao = (req, res, next) => {
    if (!res.locals.user) {
        return res.redirect('/auth/login');
    }

    req.user = res.locals.user;
    next();
};

/**
 * Middleware — redireciona utilizadores já logados (ex: páginas de login/registo).
 * Reutiliza o res.locals.user já injetado pelo injetarUserNasViews.
 */
const redirecionarLogged = (req, res, next) => {
    if (res.locals.user) {
        return res.redirect(getDashboardUrl(res.locals.user.role));
    }
    next();
};

/**
 * Middleware factory — restringe acesso a roles específicas.
 */
function verificarRole(rolesPermitidas) {
    return function (req, res, next) {
        if (!req.user || !rolesPermitidas.includes(req.user.role)) {
            return res.status(403).send('Acesso Restrito. Não tem permissões para aceder a esta página.');
        }
        next();
    };
}

module.exports = {
    injetarUserNasViews,
    verificarAutenticacao,
    redirecionarLogged,
    verificarRole,
    getDashboardUrl
};
