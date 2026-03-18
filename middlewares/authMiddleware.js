/**
 * Middleware para verificar se o utilizador está autenticado.
 * Se não estiver logado, redireciona para a página de login.
 */
const verificarAutenticacao = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/auth/login');
};

/**
 * Middleware para impedir que utilizadores já logados acedam a páginas
 * como Login ou Registo. Redireciona-os para a página principal (perfil).
 */
const redirectLogged = (req, res, next) => {
    if (req.session && req.session.user) {
        return res.redirect('/users/perfil');
    }
    next();
};

module.exports = {
    verificarAutenticacao,
    redirecionarSeLogado: redirectLogged
};
