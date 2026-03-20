const Product = require('../models/ProductModel');
const Supermarket = require('../models/SupermarketModel');

/**
 * Exibe a Dashboard do Supermercado.
 */
const exibirDashboard = async (req, res) => {
    // Aqui no futuro vamos buscar os produtos desta loja
    res.render('supermercado/dashboard');
};

module.exports = {
    exibirDashboard
};