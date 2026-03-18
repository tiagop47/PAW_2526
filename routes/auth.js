const express = require('express');
const router = express.Router();

/**
 * Rota para login de utilizadores.
 */
router.get('/login', (req, res) => {
    res.render('loginRegisto/login', { errorMessage: null });
});

/**
 * Rota para registo de utilizadores.
 */
router.get("/registar", (req, res) => {
    res.render("loginRegisto/registar", { errorMessage: null });
});

/**
 * Rota para recuperação de palavra-passe.
 */
router.get("/recoverPassword", (req, res) => {
    res.render("loginRegisto/recuperarPassword");
});

module.exports = router;
