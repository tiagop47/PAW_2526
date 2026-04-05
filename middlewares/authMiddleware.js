const jwt = require('jsonwebtoken');
const Supermarket = require('../models/SupermarketModel'); 
const config = require('../config/config');
const { getDashboardUrl } = require('../utils/authUtils');

const JWT_SECRET = config.JWT_SECRET;

var authMiddleware = {};

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
        return res.redirect(getDashboardUrl(res.locals.user.role));
    }
    next();
};

/**
 * Middleware factory — restringe acesso a roles específicas.
 */
authMiddleware.verificarRole = function (rolesPermitidas) {
    return function (req, res, next) {
        if (!req.user || !rolesPermitidas.includes(req.user.role)) {
            return res.status(403).send('Acesso Restrito.');
        }
        next();
    };
};

/**
 * Middleware — garante que o supermercado já foi aprovado.
 */
authMiddleware.verificarAprovacaoSupermercado = async function (req, res, next) {
    if (req.user && req.user.role === 'supermercados') {
        try {
            const superMercado = await Supermarket.findOne({ userId: req.user.id });
            if (!superMercado || superMercado.estadoAprovacao !== 'Aprovado') {
                return res.status(403).render('supermercado/aguardaAprovacao',
                    {
                        title: 'Aguarda Aprovação',
                        estado: superMercado ? superMercado.estadoAprovacao : 'Pendente'
                    });
            }
        } catch (err) {
            return res.status(500).send('Erro ao verificar aprovação.');
        }
    }
    next();
};

module.exports = authMiddleware;
