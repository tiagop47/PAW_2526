const Product = require('../models/ProductModel');
const Supermarket = require('../models/SupermarketModel');
const Order = require('../models/OrderModel');
const User = require('../models/UserModel');
const bcrypt = require('bcrypt');

const RAIO_TERRA_KM = 6371;
const paraRadianos = (value) => value * (Math.PI / 180);
const distanciaKM = ([lon1, lat1], [lon2, lat2]) => {
    const dLat = paraRadianos(lat2 - lat1);
    const dLon = paraRadianos(lon2 - lon1);
    const lat1Rad = paraRadianos(lat1);
    const lat2Rad = paraRadianos(lat2);

    const a = Math.sin(dLat / 2) ** 2
        + Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) ** 2;

    return 2 * RAIO_TERRA_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const supermarketService = {};

supermarketService.getSupermercado = async function (userId) {
    const supermercado = await Supermarket.findOne({ userId });
    if (!supermercado) {
        throw new Error('Supermercado não encontrado');
    }
    return supermercado;
};

supermarketService.obterDadosDashboard = async function (userId) {
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

supermarketService.obterProdutosPorUtilizador = async function (userId) {
    const supermercado = await this.getSupermercado(userId);
    return Product.find({ supermercadoId: supermercado._id });
};

supermarketService.obterProdutoPorIdParaUtilizador = async function (userId, productId) {
    const supermercado = await this.getSupermercado(userId);
    return Product.findOne({ _id: productId, supermercadoId: supermercado._id });
};

supermarketService.criarProduto = async function (userId, productData) {
    const supermercado = await this.getSupermercado(userId);
    const novoProduto = Object.assign({}, productData);

    novoProduto.supermercadoId = supermercado._id;
    return Product.create(novoProduto);
};

supermarketService.atualizarProdutoPorIdParaUtilizador = async function (userId, productId, updateData) {
    const supermercado = await this.getSupermercado(userId);
    return Product.findOneAndUpdate(
        { _id: productId, supermercadoId: supermercado._id },
        updateData,
        { new: true }
    );
};

supermarketService.eliminarProdutoPorIdParaUtilizador = async function (userId, productId) {
    const supermercado = await this.getSupermercado(userId);
    return Product.findOneAndDelete({
        _id: productId,
        supermercadoId: supermercado._id
    });
};

supermarketService.pesquisarProdutos = async function (userId, { q, categoria }) {
    const supermercado = await this.getSupermercado(userId);
    const filtro = { supermercadoId: supermercado._id };
    if (q) {
        filtro.nome = { $regex: q, $options: 'i' };
    }
    if (categoria) {
        filtro.categoria = categoria;
    }

    return Product.find(filtro).sort({ nome: 1 });
};

supermarketService.obterSupermercadoPorUtilizadorId = async function (userId) {
    return this.getSupermercado(userId);
};

supermarketService.atualizarSupermercadoPorUtilizadorId = async function (userId, dadosSupermercado) {
    const { latitude, longitude } = dadosSupermercado;

    if (latitude && longitude) {
        dadosSupermercado.localizacaoGeo = {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
        };
    }

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

supermarketService.obterEncomendasPorUtilizadorId = async function (userId) {
    const supermercado = await this.getSupermercado(userId);

    return Order.find({ supermercadoId: supermercado._id })
        .populate('clienteId', 'nome email telefone')
        .sort({ criadoEm: -1 });
};

supermarketService.obterEncomendaPorIdParaUtilizador = async function (userId, orderId) {
    const supermercado = await this.getSupermercado(userId);
    return Order.findOne({ _id: orderId, supermercadoId: supermercado._id })
        .populate('clienteId', 'nome email telefone');
};

supermarketService.atualizarEstadoEncomendaPorIdParaUtilizador = async function (userId, orderId, estado) {
    const supermercado = await this.getSupermercado(userId);
    return Order.findOneAndUpdate(
        { _id: orderId, supermercadoId: supermercado._id },
        { estado },
        { new: true }
    );
};

supermarketService.obterProdutosDisponiveisParaVendaPorUtilizadorId = async function (userId) {
    const supermercado = await this.getSupermercado(userId);
    return Product.find({ supermercadoId: supermercado._id, stockDisponivel: { $gt: 0 } });
};

supermarketService.registarVenda = async function (userId, saleData) {
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
    if (!principal) {
        return [];
    }
    if (!principal.localizacaoGeo || !Array.isArray(principal.localizacaoGeo.coordinates)) {
        return [];
    }

    const outros = await Supermarket.find({
        _id: { $ne: supermercadoId },
        estadoAprovacao: 'Aprovado'
    });

    return outros.filter(outro => {
        if (!outro.localizacaoGeo || !Array.isArray(outro.localizacaoGeo.coordinates)) return false;
        const distancia = distanciaKM(
            principal.localizacaoGeo.coordinates,
            outro.localizacaoGeo.coordinates
        );

        return distancia < (principal.raioAtuacao + outro.raioAtuacao);
    });
};

supermarketService.getDescontosCruzadosNaZona = async function (supermercadoId) {
    const mercadoAtual = await Supermarket.findById(supermercadoId);
    if (!mercadoAtual) {
        return [];
    }

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
