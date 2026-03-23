const Product = require('../models/ProductModel');
const Supermarket = require('../models/SupermarketModel');
const Order = require('../models/OrderModel');
const User = require('../models/UserModel');
const bcrypt = require('bcrypt');

/**
 * Obtém os dados necessários para a dashboard do supermercado.
 */
async function getDashboardData(userId) {
    const supermercado = await Supermarket.findOne({ userId });
    if (!supermercado) {
        throw new Error('Supermercado não encontrado');
    }

    const [totalProdutos, totalEncomendas, encomendas, vendasStats] = await Promise.all([
        Product.countDocuments({ supermercadoId: supermercado._id }),
        Order.countDocuments({ supermercadoId: supermercado._id }),
        Order.find({ supermercadoId: supermercado._id })
            .populate('clienteId', 'nome')
            .sort({ criadoEm: -1 })
            .limit(5),
        Order.aggregate([
            { $match: { supermercadoId: supermercado._id } },
            { $group: { _id: null, total: { $sum: "$valorTotal" } } }
        ])
    ]);

    const vendasTotais = vendasStats.length > 0 ? vendasStats[0].total : 0;

    return {
        totalProdutos,
        totalEncomendas,
        vendasTotais,
        encomendas
    };
};

/**
 * Obtém todos os produtos de um supermercado.
 */
const getProductsByUserId = async (userId) => {
    const supermercado = await Supermarket.findOne({ userId });
    if (!supermercado) {
        throw new Error('Supermercado não encontrado');
    }

    return Product.find({ supermercadoId: supermercado._id });
};

/**
 * Cria um novo produto.
 */
const createProduct = async (userId, productData) => {
    const supermercado = await Supermarket.findOne({ userId });
    if (!supermercado) {
        throw new Error('Supermercado não encontrado');
    }

    const novoProduto = Object.assign({}, productData);
    novoProduto.supermercadoId = supermercado._id;

    return Product.create(novoProduto);
};

/**
 * Pesquisa produtos com filtros.
 */
const searchProducts = async (userId, { q, categoria }) => {
    const supermercado = await Supermarket.findOne({ userId });
    if (!supermercado) {
        throw new Error('Supermercado não encontrado');
    }

    const filtro = { supermercadoId: supermercado._id };
    if (q) filtro.nome = { $regex: q, $options: 'i' };
    if (categoria) filtro.categoria = categoria;

    return Product.find(filtro).sort({ nome: 1 });
};

/**
 * Regista uma venda em caixa.
 */
const registerSale = async (userId, saleData) => {
    const { emailCliente, nomeCliente, telefoneCliente, moradaCliente, listaItens } = saleData;
    const supermercado = await Supermarket.findOne({ userId });
    if (!supermercado) throw new Error('Supermercado não encontrado');

    // Procurar ou criar cliente
    let cliente = await User.findOne({ email: emailCliente });
    if (!cliente) {
        const passwordTemp = 'Temp1234';
        const hash = await bcrypt.hash(passwordTemp, 12);
        cliente = await User.create({
            nome: nomeCliente || 'Cliente Loja',
            email: emailCliente,
            password: hash,
            telefone: telefoneCliente || '000000000',
            morada: moradaCliente || 'Compra em loja',
            role: 'clientes'
        });
    }

    const produtosEncomenda = [];
    let valorTotal = 0;

    for (const item of listaItens) {
        const produto = await Product.findById(item.produtoId);
        if (!produto || produto.stockDisponivel < item.quantidade) {
            throw new Error(`Stock insuficiente para ${produto ? produto.nome : 'produto desconhecido'}.`);
        }

        produtosEncomenda.push({
            produtoId: produto._id,
            quantidade: item.quantidade,
            precoUnitario: produto.preco
        });
        valorTotal += produto.preco * item.quantidade;

        produto.stockDisponivel -= item.quantidade;
        await produto.save();
    }

    return Order.create({
        supermercadoId: supermercado._id,
        clienteId: cliente._id,
        produtos: produtosEncomenda,
        valorTotal,
        estado: 'entregue',
        metodoEntrega: 'levantamento em loja'
    });
};

module.exports = {
    getDashboardData,
    getProductsByUserId,
    createProduct,
    searchProducts,
    registerSale
};
