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
    // Tentar primeiro o cookie (backoffice), depois o header Authorization (frontoffice/API)
    let token = req.cookies.token;

    if (!token) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
    }

    if (!token) return null;

    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        if (req.cookies.token) {
            res.clearCookie('token');
        }
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
        // Se for uma chamada API, responder com JSON em vez de redirecionar
        if (req.originalUrl.startsWith('/api')) {
            return res.status(401).json({ sucesso: false, erro: 'Autenticação necessária.' });
        }
        return res.redirect('/auth/login');
    }
    req.user = res.locals.user;
    next();
};

/**
 * Middleware — redireciona utilizadores já logados.
 * Exceção: Administradores podem aceder ao registo se for para criar um novo gestor (onlyUser=true).
 */
authMiddleware.redirecionarLogged = function (req, res, next) {
    if (res.locals.user) {
        if (res.locals.user.role === 'administrador' && req.query.onlyUser === 'true') {
            return next();
        }
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
            // Se for uma chamada API, responder com JSON
            if (req.originalUrl.startsWith('/api')) {
                return res.status(403).json({ sucesso: false, erro: 'Acesso restrito.' });
            }
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
