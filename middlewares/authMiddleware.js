const jwt = require('jsonwebtoken');

/**
 * Middleware para verificar se o utilizador está autenticado via Token (Cookie).
 * Se não estiver logado, redireciona para a página de login.
 */
const verificarAutenticacao = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.redirect('/auth/login');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'segredo_temporario');
        req.user = decoded;
        next();
    } catch (err) {
        res.clearCookie('token');
        return res.redirect('/auth/login');
    }
};

/**
 * Middleware para impedir que utilizadores já logados acedam a páginas
 * como Login ou Registo. Redireciona-os para a sua dashboard.
 */
const redirecionarSeLogado = (req, res, next) => {
    const token = req.cookies.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'segredo_temporario');
            let rota = decoded.role;

            if (decoded.role === 'administradores') {
                rota = 'admin';
            }
            if (decoded.role === 'supermercados') {
                rota = 'supermercado';
            }
            if (decoded.role === 'estafetas') {
                rota = 'estafeta';
            }
            if (decoded.role === 'clientes') {
                rota = 'cliente';
            }

            return res.redirect(`/${rota}/dashboard`);
        } catch (err) {
            res.clearCookie('token');
        }
    }
    next();
};

/**
 * Middleware de Controlo de Acesso Baseado no Perfil (Role).
 * Só permite acesso se o utilizador tiver uma das roles permitidas.
 */
const verificarRole = (rolesPermitidas) => {
    return (req, res, next) => {
        if (!req.user || !rolesPermitidas.includes(req.user.role)) {
            return res.status(403).send("Acesso Restrito. Não tem permissões para aceder a esta página.");
        }
        next();
    };
};

module.exports = {
    verificarAutenticacao,
    redirecionarSeLogado,
    verificarRole
};
