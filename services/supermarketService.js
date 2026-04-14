const Product = require('../models/ProductModel');
const Supermarket = require('../models/SupermarketModel');
const Order = require('../models/OrderModel');
const User = require('../models/UserModel');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const config = require('../config/config');

const Category = require('../models/CategoryModel');

const supermarketService = {};

/**
 * Categorias
 */
supermarketService.listarCategorias = async function () {
    return Category.find().sort({ nome: 1 });
};

/**
 * Produtos
 */
supermarketService.obterProdutosPorSupermercado = async function (supermercadoId, query = {}) {
    const filter = { supermercadoId: supermercadoId };
    if (query.categoria) filter.categoriaId = query.categoria;
    if (query.search) filter.nome = { $regex: query.search, $options: 'i' };

    return Product.find(filter).populate('categoriaId');
};

supermarketService.criarProduto = async function (produtoData) {
    const novoProduto = new Product(produtoData);
    return novoProduto.save();
};

supermarketService.obterProdutoPorId = async function (produtoId) {
    return Product.findById(produtoId).populate('categoriaId');
};

supermarketService.atualizarProduto = async function (produtoId, produtoData) {
    return Product.findByIdAndUpdate(produtoId, produtoData, { new: true });
};

supermarketService.eliminarProduto = async function (produtoId) {
    return Product.findByIdAndDelete(produtoId);
};

/**
 * Estatísticas e Dashboard
 */
supermarketService.obterDadosDashboard = async function (supermercadoId) {
    const [totalProdutos, totalEncomendas, encomendas, vendasStats, top5Produtos] = await Promise.all([
        Product.countDocuments({ supermercadoId }),
        Order.countDocuments({ supermercadoId }),
        Order.find({ supermercadoId }).sort({ dataCriacao: -1 }).limit(10).populate('clienteId'),
        Order.aggregate([
            { $match: { supermercadoId: new mongoose.Types.ObjectId(supermercadoId), estado: 'entregue' } },
            { $group: { _id: null, total: { $sum: '$valorTotal' } } }
        ]),
        Order.aggregate([
            { $match: { supermercadoId: new mongoose.Types.ObjectId(supermercadoId) } },
            { $unwind: '$produtos' },
            { $group: { _id: '$produtos.produtoId', totalVendido: { $sum: '$produtos.quantidade' } } },
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
            { $unwind: '$detalhes' }
        ])
    ]);

    return {
        totalProdutos,
        totalEncomendas,
        encomendas,
        vendasTotais: vendasStats.length > 0 ? vendasStats[0].total : 0,
        top5Produtos
    };
};

/**
 * Encomendas
 */
supermarketService.listarEncomendas = async function (supermercadoId, status) {
    const filter = { supermercadoId };
    if (status) filter.estado = status;
    return Order.find(filter).sort({ dataCriacao: -1 }).populate('clienteId');
};

supermarketService.obterEncomendaPorId = async function (encomendaId) {
    return Order.findById(encomendaId).populate('clienteId').populate('produtos.produtoId');
};

supermarketService.atualizarEstadoEncomenda = async function (encomendaId, estado) {
    const order = await Order.findById(encomendaId);
    if (!order) throw new Error('Encomenda não encontrada');

    const estadoAnterior = order.estado;

    if (estado === 'confirmada' && (estadoAnterior === 'pendente' || estadoAnterior === 'em processamento')) {
        // Se for venda em caixa, o cliente já foi processado no registarVenda
        // Mas para encomendas normais, garantimos que o stock é abatido aqui se necessário
        // (A lógica de stock costuma estar no momento do pagamento/confirmação)
    }

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
    const { emailCliente, nomeCliente, nifCliente, telefoneCliente, moradaCliente, latitudeEntrega, longitudeEntrega, listaItens, metodoEntrega } = saleData;

    let cliente;

    if (emailCliente) {
        cliente = await User.findOne({ email: emailCliente });
        if (!cliente) {
            throw new Error('O email inserido não está associado a nenhuma conta.');
        }
    } else {
        const emailFinal = 'cliente@teste.com';
        const nifFinal = nifCliente || '999999990';

        cliente = await User.findOne({ $or: [{ email: emailFinal }, { nif: nifFinal }] });

        if (!cliente) {
            const passwordTemp = config.DEFAULT_ADMIN_PASSWORD;
            
            if (!passwordTemp) {
                throw new Error("Esta conta não existe, insira um utilizador válido.");
            }

            const saltRounds = config.SALT_ROUNDS || 10;
            const hash = await bcrypt.hash(passwordTemp, saltRounds);

            cliente = await User.create({
                nome: nomeCliente || 'Consumidor Final',
                email: emailFinal,
                password: hash,
                telefone: telefoneCliente || '900000000',
                nif: nifFinal,
                morada: moradaCliente || 'Venda Local em Loja',
                role: 'clientes'
            });
        }
    }

    const produtosEncomenda = [];
    let valorTotal = 0;

    for (const item of listaItens) {
        const produto = await Product.findOneAndUpdate(
            {
                _id: item.produtoId,
                stockDisponivel: { $gte: item.quantidade }
            },
            {
                $inc: { stockDisponivel: -item.quantidade }
            },
            { new: true, runValidators: true, context: 'query' }
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

    const eDomicilio = metodoEntrega === 'entrega ao domicilio';
    const estadoFinal = eDomicilio ? 'confirmada' : 'entregue';
    const lat = Number(latitudeEntrega);
    const lng = Number(longitudeEntrega);
    const temCoordenadasValidas = Number.isFinite(lat) && Number.isFinite(lng);

    const novaOrdem = new Order({
        clienteId: cliente._id,
        supermercadoId: supermercadoId,
        produtos: produtosEncomenda,
        valorTotal: valorTotal,
        metodoPagamento: 'dinheiro',
        estado: estadoFinal,
        moradaEntrega: eDomicilio ? moradaCliente : 'Venda Local em Loja',
        latitude: temCoordenadasValidas ? lat : undefined,
        longitude: temCoordenadasValidas ? lng : undefined
    });

    return await novaOrdem.save();
};

module.exports = supermarketService;
