const Product = require('../models/ProductModel');
const Supermarket = require('../models/SupermarketModel');
const Order = require('../models/OrderModel');
const User = require('../models/UserModel');
const bcrypt = require('bcrypt');

const supermarketService = {};

supermarketService.getSupermercado = async function (userId) {
    const supermercado = await Supermarket.findOne({ userId });
    if (!supermercado) {
        throw new Error('Supermercado não encontrado');
    }
    return supermercado;
};

supermarketService.getDashboardData = async function (userId) {
    const supermercado = await this.getSupermercado(userId);

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

supermarketService.getProductByUser = async function (userId) {
    const supermercado = await this.getSupermercado(userId);
    return Product.find({ supermercadoId: supermercado._id });
};

supermarketService.getProductByIdForUser = async function (userId, productId) {
    const supermercado = await this.getSupermercado(userId);
    return Product.findOne({ _id: productId, supermercadoId: supermercado._id });
};

supermarketService.createProduct = async function (userId, productData) {
    const supermercado = await this.getSupermercado(userId);
    const novoProduto = Object.assign({}, productData);
    novoProduto.supermercadoId = supermercado._id;
    return Product.create(novoProduto);
};

supermarketService.updateProductByIdForUser = async function (userId, productId, updateData) {
    const supermercado = await this.getSupermercado(userId);
    return Product.findOneAndUpdate(
        { _id: productId, supermercadoId: supermercado._id },
        updateData,
        { new: true }
    );
};

supermarketService.deleteProductByIdForUser = async function (userId, productId) {
    const supermercado = await this.getSupermercado(userId);
    return Product.findOneAndDelete({
        _id: productId,
        supermercadoId: supermercado._id
    });
};

supermarketService.searchProducts = async function (userId, { q, categoria }) {
    const supermercado = await this.getSupermercado(userId);
    const filtro = { supermercadoId: supermercado._id };
    if (q) filtro.nome = { $regex: q, $options: 'i' };
    if (categoria) filtro.categoria = categoria;
    return Product.find(filtro).sort({ nome: 1 });
};

supermarketService.getSupermarketByUserId = async function (userId) {
    return this.getSupermercado(userId);
};

const geoService = require('./geoService'); // Importar geoService

// ... (dentro de supermarketService)

supermarketService.updateSupermarketByUserId = async function(userId, dadosSupermercado) {
    const { latitude, longitude } = dadosSupermercado;

    // Se as coordenadas foram enviadas (via clique no mapa)
    if (latitude && longitude) {
        dadosSupermercado.localizacaoGeo = {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
        };

        // Atualizar o nome legível da localização via Reverse Geocoding
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await res.json();
            if (data.display_name) {
                dadosSupermercado.localizacao = data.display_name;
            }
        } catch (e) { /* fallback mantido */ }
    }

    // Garantir que metodosEntrega é um array
    if (dadosSupermercado.metodosEntrega) {
        dadosSupermercado.metodosEntrega = Array.isArray(dadosSupermercado.metodosEntrega) 
            ? dadosSupermercado.metodosEntrega 
            : [dadosSupermercado.metodosEntrega];
    }

    return Supermarket.findOneAndUpdate({ userId }, dadosSupermercado, { new: true });
};

supermarketService.getUserByIdSemPassword = async function (userId) {
    return User.findById(userId).select('-password');
};

supermarketService.getOrdersByUserId = async function (userId) {
    const supermercado = await this.getSupermercado(userId);
    return Order.find({ supermercadoId: supermercado._id })
        .populate('clienteId', 'nome email telefone')
        .sort({ criadoEm: -1 });
};

supermarketService.updateOrderStatusByIdForUser = async function (userId, orderId, estado) {
    const supermercado = await this.getSupermercado(userId);
    return Order.findOneAndUpdate(
        { _id: orderId, supermercadoId: supermercado._id },
        { estado },
        { new: true }
    );
};

supermarketService.getAvailableProductsForSaleByUserId = async function (userId) {
    const supermercado = await this.getSupermercado(userId);
    return Product.find({ supermercadoId: supermercado._id, stockDisponivel: { $gt: 0 } });
};

supermarketService.registerSale = async function (userId, saleData) {
    const { emailCliente, nomeCliente, telefoneCliente, moradaCliente, listaItens } = saleData;
    const supermercado = await this.getSupermercado(userId);

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

supermarketService.getMercadosComInterseccao = async function (supermercadoId) {
    const principal = await Supermarket.findById(supermercadoId);
    if (!principal) return [];

    const outros = await Supermarket.find({
        _id: { $ne: supermercadoId },
        estadoAprovacao: 'Aprovado'
    });

    return outros.filter(outro => {
        const [lon1, lat1] = principal.localizacaoGeo.coordinates;
        const [lon2, lat2] = outro.localizacaoGeo.coordinates;

        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distancia = R * c;

        return distancia < (principal.raioAtuacao + outro.raioAtuacao);
    });
};

supermarketService.getDescontosCruzadosNaZona = async function (supermercadoId) {
    const mercadoAtual = await Supermarket.findById(supermercadoId);
    if (!mercadoAtual) return [];

    const concorrentes = await this.getMercadosComInterseccao(supermercadoId);
    const resultadosCruzados = [];

    for (const concorrente of concorrentes) {
        const produtosConcorrente = await Product.find({
            supermercadoId: concorrente._id,
            stockDisponivel: { $gt: 0 }
        }).sort({ preco: 1 }).limit(3);

        resultadosCruzados.push({
            supermercadoNome: concorrente.nome,
            distanciaEntreCentros: "Calculada",
            ofertas: produtosConcorrente
        });
    }

    return resultadosCruzados;
};

module.exports = supermarketService;
