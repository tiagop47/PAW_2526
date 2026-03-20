const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'segredo_temporario';

/**
 * Helper interno — descodifica o token JWT do cookie.
 * Retorna o payload do utilizador ou null.
 */
const descodificarToken = (req, res) => {
    const token = req.cookies.token;
    if (!token) return null;

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
 */
const verificarAutenticacao = (req, res, next) => {
    const user = descodificarToken(req, res);
    if (!user) return res.redirect('/auth/login');
    req.user = user;
    next();
};

/**
 * Middleware — redireciona utilizadores já logados (ex: páginas de login/registo).
 */
const redirecionarSeLogado = (req, res, next) => {
    const user = descodificarToken(req, res);
    if (user) return res.redirect(`/${user.role}/dashboard`);
    next();
};

/**
 * Middleware factory — restringe acesso a roles específicas.
 */
const verificarRole = (rolesPermitidas) => (req, res, next) => {
    if (!req.user || !rolesPermitidas.includes(req.user.role)) {
        return res.status(403).send('Acesso Restrito. Não tem permissões para aceder a esta página.');
    }
    next();
};

module.exports = {
    injetarUserNasViews,
    verificarAutenticacao,
    redirecionarSeLogado,
    verificarRole
};
