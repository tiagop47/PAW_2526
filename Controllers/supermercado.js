const Product = require('../models/ProductModel');
const Supermarket = require('../models/SupermarketModel');

/**
 * Exibe a Dashboard do Supermercado.
 */
const exibirDashboard = async (req, res) => {
    // Aqui no futuro vamos buscar os produtos desta loja
    res.render('supermercado/dashboard', { title: 'Dashboard Supermercado' });
};

/**
 * Exibe a página de gestão de produtos.
 */
const exibirProdutos = async (req, res) => {
    try {
        const produtos = await Product.find();
        res.render('supermercado/produtos', {
            title: 'Gerir Produtos',
            produtos
        });
    } catch (err) {
        res.status(500).send('Erro ao carregar produtos.');
    }
};

module.exports = {
    exibirDashboard,
    exibirProdutos
};