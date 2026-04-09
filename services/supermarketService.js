const Product = require('../models/ProductModel');
const Supermarket = require('../models/SupermarketModel');
const Order = require('../models/OrderModel');
const User = require('../models/UserModel');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const config = require('../config/config');

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

/**
 * Carrega o supermercado associado a um userId.
 * Usado pelo middleware global das rotas para injetar req.supermercado.
 */
supermarketService.getSupermercado = async function (userId) {
    const supermercado = await Supermarket.findOne({ userId });
    if (!supermercado) {
        throw new Error('Supermercado não encontrado');
    }
    return supermercado;
};
supermarketService.obterDadosDashboard = async function (supermercadoId) {
    const [totalProdutos, totalEncomendas, encomendas, vendasStats, top5Produtos] = await Promise.all([
        Product.countDocuments({ supermercadoId }),
        Order.countDocuments({ supermercadoId, estado: { $ne: 'cancelada' } }),
        Order.find({ supermercadoId })
            .populate('clienteId', 'nome')
            .sort({ criadoEm: -1 })
            .limit(5),
        Order.aggregate([
            {
                $match: {
                    supermercadoId: new mongoose.Types.ObjectId(supermercadoId),
                    estado: { $ne: 'cancelada' }
                }
            },
            { $group: { _id: null, total: { $sum: "$valorTotal" } } }
        ]),
        Order.aggregate([
            { 
                $match: { 
                    supermercadoId: new mongoose.Types.ObjectId(supermercadoId),
                    estado: 'entregue' 
                } 
            },
            { $unwind: '$produtos' },
            { 
                $group: { 
                    _id: '$produtos.produtoId', 
                    totalVendido: { $sum: '$produtos.quantidade' },
                    faturado: { $sum: { $multiply: ['$produtos.quantidade', '$produtos.precoUnitario'] } }
                } 
            },
            { $sort: { totalVendido: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'detalhes'
                }
            },
            { $unwind: '$detalhes' },
            {
                $project: {
                    nome: '$detalhes.nome',
                    totalVendido: 1,
                    faturado: 1
                }
            }
        ])
    ]);

    return {
        totalProdutos,
        totalEncomendas,
        vendasTotais: vendasStats.length > 0 ? vendasStats[0].total : 0,
        encomendas,
        top5Produtos
    };
};
supermarketService.obterProdutos = async function (supermercadoId) {
    return Product.find({ supermercadoId });
};

supermarketService.obterProdutoPorId = async function (supermercadoId, productId) {
    return Product.findOne({ _id: productId, supermercadoId });
};

supermarketService.criarProduto = async function (supermercadoId, productData) {
    return Product.create({ ...productData, supermercadoId });
};

supermarketService.atualizarProduto = async function (supermercadoId, productId, updateData) {
    return Product.findOneAndUpdate(
        { _id: productId, supermercadoId },
        updateData,
        { new: true }
    );
};

supermarketService.eliminarProduto = async function (supermercadoId, productId) {
    return Product.findOneAndDelete({ _id: productId, supermercadoId });
};

supermarketService.pesquisarProdutos = async function (supermercadoId, { q, categoria }) {
    const filtro = { supermercadoId };
    if (q) {
        filtro.nome = { $regex: q, $options: 'i' };
    }
    if (categoria) {
        filtro.categoria = categoria;
    }
    return Product.find(filtro).sort({ nome: 1 });
};

supermarketService.obterProdutosDisponiveis = async function (supermercadoId) {
    return Product.find({ supermercadoId, stockDisponivel: { $gt: 0 } });
};

supermarketService.atualizarSupermercado = async function (supermercadoId, dadosSupermercado) {
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

    return Supermarket.findByIdAndUpdate(supermercadoId, dadosSupermercado, { new: true });
};

supermarketService.getUserByIdSemPassword = async function (userId) {
    return User.findById(userId).select('-password');
};

supermarketService.obterEncomendas = async function (supermercadoId) {
    return Order.find({ supermercadoId })
        .populate('clienteId', 'nome email telefone')
        .sort({ criadoEm: -1 });
};

supermarketService.obterEncomendaPorId = async function (supermercadoId, orderId) {
    return Order.findOne({ _id: orderId, supermercadoId })
        .populate('clienteId', 'nome email telefone');
};

supermarketService.atualizarEstadoEncomenda = async function (supermercadoId, orderId, estado) {
    const order = await Order.findOne({ _id: orderId, supermercadoId });
    if (!order) return null;

    const estadoAnterior = order.estado;

    // 1. Lógica de REDUÇÃO de Stock
    // Se passar de 'pendente' para um estado ativo (confirmada, em entrega, entregue), reduzimos o stock
    if (estadoAnterior === 'pendente' && (estado === 'confirmada' || estado === 'em entrega' || estado === 'entregue')) {
        for (const item of order.produtos) {
            const produto = await Product.findOneAndUpdate(
                {
                    _id: item.produtoId,
                    stockDisponivel: { $gte: item.quantidade }
                },
                {
                    $inc: { stockDisponivel: -item.quantidade }
                },
                { new: true }
            );

            if (!produto) {
                // Se um dos produtos falhar por falta de stock, lançamos erro e não mudamos o estado
                const pInfo = await Product.findById(item.produtoId);
                throw new Error(`Stock insuficiente para confirmar a encomenda: ${pInfo ? pInfo.nome : 'Produto desconhecido'}`);
            }
        }
    }

    // 2. Lógica de REPOSIÇÃO de Stock
    // Se o novo estado for 'cancelada', só repomos se o estado anterior não fosse 'pendente' 
    // (ou seja, se o stock já tivesse sido reduzido anteriormente)
    if (estado === 'cancelada' && estadoAnterior !== 'cancelada' && estadoAnterior !== 'pendente') {
        for (const item of order.produtos) {
            await Product.findByIdAndUpdate(item.produtoId, {
                $inc: { stockDisponivel: item.quantidade }
            });
        }
    }

    order.estado = estado;
    return order.save();
};

supermarketService.registarVenda = async function (supermercadoId, saleData) {
    const { emailCliente, nomeCliente, telefoneCliente, moradaCliente, latitudeEntrega, longitudeEntrega, listaItens, metodoEntrega } = saleData;

    const emailFinal = emailCliente || 'cliente@teste.com';
    let cliente = await User.findOne({ email: emailFinal });

    if (!cliente) {
        const passwordTemp = config.DEFAULT_USER_PASSWORD;
        const hash = await bcrypt.hash(passwordTemp, 12);
        const nifFinal = '999999990';

        cliente = await User.create({
            nome: nomeCliente || (emailFinal === 'cliente@teste.com' ? 'Consumidor Final' : 'Cliente Loja'),
            email: emailFinal,
            password: hash,
            telefone: telefoneCliente || '000000000',
            nif: nifFinal,
            morada: moradaCliente || 'Venda em loja',
            role: 'clientes'
        });
    }

    const produtosEncomenda = [];
    let valorTotal = 0;

    for (const item of listaItens) {
        // Atualização atómica: só subtrai se houver stock suficiente
        const produto = await Product.findOneAndUpdate(
            {
                _id: item.produtoId,
                stockDisponivel: { $gte: item.quantidade }
            },
            {
                $inc: { stockDisponivel: -item.quantidade }
            },
            { new: true }
        );

        if (!produto) {
            const pInfo = await Product.findById(item.produtoId);
            throw new Error(`Stock insuficiente ou produto não encontrado: ${pInfo ? pInfo.nome : 'ID ' + item.produtoId}`);
        }

        produtosEncomenda.push({
            produtoId: produto._id,
            quantidade: item.quantidade,
            precoUnitario: produto.preco
        });
        valorTotal += produto.preco * item.quantidade;
    }

    // Se for para entregar, o estado deve ser 'confirmada' para aparecer para o estafeta.
    // Se for levantamento, marcamos logo como 'entregue'.
    const eDomicilio = metodoEntrega === 'entrega ao domicilio';
    const estadoFinal = eDomicilio ? 'confirmada' : 'entregue';
    const lat = Number(latitudeEntrega);
    const lng = Number(longitudeEntrega);
    const temCoordenadasValidas = Number.isFinite(lat) && Number.isFinite(lng);

    return Order.create({
        supermercadoId,
        clienteId: cliente._id,
        produtos: produtosEncomenda,
        valorTotal,
        estado: estadoFinal,
        metodoEntrega: metodoEntrega || 'levantamento em loja',
        moradaEntrega: eDomicilio ? moradaCliente : null,
        coordenadasEntrega: (eDomicilio && temCoordenadasValidas) ? { lat, lng } : undefined
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
