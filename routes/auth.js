var express = require('express');
var router = express.Router();

/**
 * Rota para login de utilizadores.
 */
router.get('/login', function (req, res, next) {
    res.render('loginRegisto/login', { errorMessage: null });
});

/**
 * Rota para registo de utilizadores.
 */
router.get("/register", (req, res) => {
    res.render("loginRegisto/register");
});

/**
* Rota para registo de utilizadores.
*/
router.get("/recoverPassword", (req, res) => {
    res.render("loginRegisto/recoverPassword");
});

module.exports = router;
