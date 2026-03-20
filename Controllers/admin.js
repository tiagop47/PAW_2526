const Supermarket = require('../models/SupermarketModel');
const User = require('../models/UserModel');

/**
 * Exibe a Dashboard do Administrador.
 */
const exibirDashboard = async (req, res) => {
    // Aqui no futuro vamos buscar estatísticas ou supermercados pendentes
    res.render('admin/dashboard');
};

module.exports = {
    exibirDashboard
};