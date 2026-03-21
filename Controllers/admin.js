const Supermarket = require('../models/SupermarketModel');
const User = require('../models/UserModel');

/**
 * Exibe a Dashboard do Administrador.
 */
const exibirDashboard = async (req, res) => {
    res.render('admin/dashboard');
};

module.exports = {
    exibirDashboard
};