const jwt = require('jsonwebtoken');
const config = require('../config/config');
const supermarketService = require('../services/supermarketService');

const JWT_SECRET = config.JWT_SECRET;

const DASHBOARDS = {
    administrador: "/admin/dashboard",
    supermercados: "/supermercado/dashboard",
    estafetas: "/estafeta/dashboard",
};

var authMiddleware = {};

/**
 * Retorna a URL do dashboard baseada na role do utilizador.
 */
authMiddleware.getDashboardUrl = function (role) {
    return DASHBOARDS[role] || "/auth/login";
};

/**
 * Helper interno — descodifica o token JWT do cookie.
 */
authMiddleware.descodificarToken = function (req, res) {
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
authMiddleware.injetarUserNasViews = function (req, res, next) {
    res.locals.user = authMiddleware.descodificarToken(req, res);
    next();
};

/**
 * Middleware — bloqueia acesso se não estiver autenticado.
 */
authMiddleware.verificarAutenticacao = function (req, res, next) {
    if (!res.locals.user) {
        return res.redirect('/auth/login');
    }
    req.user = res.locals.user;
    next();
};

/**
 * Middleware — redireciona utilizadores já logados.
 */
authMiddleware.redirecionarLogged = function (req, res, next) {
    if (res.locals.user) {
        return res.redirect(authMiddleware.getDashboardUrl(res.locals.user.role));
    }
    next();
};

/**
 * Middleware factory — restringe acesso a roles específicas.
 */
authMiddleware.verificarRole = function (rolesPermitidas) {
    return function (req, res, next) {
        if (!req.user || !rolesPermitidas.includes(req.user.role)) {
            const err = new Error('Acesso Restrito');
            err.status = 403;
            err.tituloErro = 'Acesso Negado';
            err.detalheErro = 'Não tens permissões suficientes para aceder a esta página. Se achas que isto é um erro, contacta o administrador.';
            return next(err);
        }
        next();
    };
};

/**
 * Middleware — garante que o supermercado já foi aprovado.
 */
authMiddleware.verificarAprovacaoSupermercado = async function (req, res, next) {
    if (!req.user || req.user.role !== 'supermercados') {
        return next();
    }

    if (['/perfil', '/editar'].includes(req.path)) {
        return next();
    }

    try {
        const supermercado = await supermarketService.getSupermercado(req.user.id);
        const estado = supermercado ? supermercado.estadoAprovacao : 'Pendente';

        if (estado === 'Aprovado') return next();

        return res.render('supermercado/aguardaAprovacao', {
            title: 'Aguarda Aprovação',
            estado,
            user: req.user
        });
    } catch (e) {
        next(e);
    }
};

module.exports = authMiddleware;
