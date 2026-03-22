const jwt = require('jsonwebtoken');
const Supermarket = require('../models/SupermarketModel'); // Importar o modelo

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
 */
const injetarUserNasViews = (req, res, next) => {
    res.locals.user = descodificarToken(req, res);
    next();
};

/**
 * Middleware — bloqueia acesso se não estiver autenticado.
 */
const verificarAutenticacao = (req, res, next) => {
    if (!res.locals.user) {
        return res.redirect('/auth/login');
    }
    req.user = res.locals.user;
    next();
};

/**
 * Middleware — redireciona utilizadores já logados.
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
            return res.status(403).send('Acesso Restrito.');
        }
        next();
    };
}

/**
 * Middleware — garante que o supermercado já foi aprovado.
 */
const verificarAprovacaoSupermercado = async (req, res, next) => {
    if (req.user && req.user.role === 'supermercados') {
        try {
            const superMercado = await Supermarket.findOne({ userId: req.user.id });
            if (!superMercado || superMercado.estadoAprovacao !== 'Aprovado') {
                return res.status(403).render('supermercado/aguardandoAprovacao',
                    {
                        title: 'Aguardando Aprovação',
                        estado: superMercado ? superMercado.estadoAprovacao : 'Pendente'
                    });
            }
        } catch (err) {
            return res.status(500).send('Erro ao verificar aprovação.');
        }
    }
    next();
};

module.exports = {
    injetarUserNasViews,
    verificarAutenticacao,
    redirecionarLogged,
    verificarRole,
    getDashboardUrl,
    verificarAprovacaoSupermercado
};
