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
 * Gera um número de fatura sequencial para um supermercado.
 * Formato: FT <ANO>/<SEQUENCIAL> (ex: FT 2024/0001)
 */
async function gerarNumeroFatura(supermercadoId) {
    const anoAtual = new Date().getFullYear();
    const count = await Order.countDocuments({
        supermercadoId,
        faturaNumero: { $regex: `^FT ${anoAtual}/` }
    });

    const sequencial = (count + 1).toString().padStart(4, '0');
    return `FT ${anoAtual}/${sequencial}`;
}

supermarketService.getSupermercado = async function (userId) {
    const supermercado = await Supermarket.findOne({ userId }).populate('userId', 'nif');
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
    return Product.find({ supermercadoId }).populate('categoriaId');
};

supermarketService.obterProdutoPorId = async function (supermercadoId, productId) {
    return Product.findOne({ _id: productId, supermercadoId }).populate('categoriaId');
};

supermarketService.criarProduto = async function (supermercadoId, productData) {
    return Product.create({
        supermercadoId: supermercadoId,
        nome: productData.nome,
        descricao: productData.descricao,
        categoriaId: productData.categoriaId,
        preco: productData.preco,
        precoAntigo: productData.precoAntigo || 0,
        stockDisponivel: productData.stockDisponivel,
        imagem: productData.imagem
    });
};

supermarketService.atualizarProduto = async function (supermercadoId, productId, updateData) {
    const camposParaAtualizar = {
        nome: updateData.nome,
        descricao: updateData.descricao,
        categoriaId: updateData.categoriaId,
        preco: updateData.preco,
        precoAntigo: updateData.precoAntigo || 0,
        stockDisponivel: updateData.stockDisponivel
    };

    
    if (updateData.imagem) {
        camposParaAtualizar.imagem = updateData.imagem;
    }

    return Product.findOneAndUpdate(
        { _id: productId, supermercadoId: supermercadoId },
        camposParaAtualizar,
        {
            new: true,
            runValidators: true,
            context: 'query'
        }
    );
};

supermarketService.eliminarProduto = async function (supermercadoId, productId) {
    return Product.findOneAndDelete({ _id: productId, supermercadoId });
};

supermarketService.pesquisarProdutos = async function (supermercadoId, { q, categoriaId }) {
    const filtro = { supermercadoId };
    if (q) {
        filtro.nome = { $regex: q, $options: 'i' };
    }
    if (categoriaId) {
        filtro.categoriaId = categoriaId;
    }
    return Product.find(filtro).sort({ nome: 1 }).populate('categoriaId');
};

supermarketService.verificarStock = async function (supermercadoId, itens) {
    const resultados = [];
    let todosDisponiveis = true;

    for (const item of itens) {
        const produto = await Product.findOne({ _id: item.produtoId, supermercadoId }) ;

        const disponivel = produto ? produto.stockDisponivel : 0;
        const erro = !produto || disponivel < item. quantidade;

        if (erro) todosDisponiveis = false;

        resultados.push({
            produtoId: item.produtoId,
            nome: produto ? produto.nome : 'Produto desconhecido',
            disponivel: disponivel,
            solicitado: item.quantidade,
            erro: erro

        });
    }

    return { sucesso: todosDisponiveis, resultados };

};

supermarketService.obterProdutosDisponiveis = async function (supermercadoId) {
    return Product.find({ supermercadoId, stockDisponivel: { $gt: 0 } });
};

supermarketService.atualizarSupermercado = async function (supermercadoId, dadosSupermercado) {
    const { latitude, longitude } = dadosSupermercado;

    if (latitude && longitude) {
        dadosSupermercado.localizacaoGeo = {
            type: 'Point',
            coordinates: [Number.parseFloat(longitude), Number.parseFloat(latitude)]
        };
    }

    if (dadosSupermercado.metodosEntrega) {
        dadosSupermercado.metodosEntrega = Array.isArray(dadosSupermercado.metodosEntrega)
            ? dadosSupermercado.metodosEntrega
            : [dadosSupermercado.metodosEntrega];
    }

    return Supermarket.findByIdAndUpdate(supermercadoId, {
        ...dadosSupermercado,
        estadoAprovacao: 'Pendente'
    }, { new: true });
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

    // Regra de negócio: cliente só pode cancelar até 5 minutos após confirmação
    if (estado === 'cancelada') {

        const agora = Date.now();
        const limiteCancelamento = new Date(order.criadoEm).getTime() + (5 * 60 * 1000);

        if (agora > limiteCancelamento) {
            throw new Error('O prazo de 5 minutos para cancelamento já expirou.');
        }
    }

    // Se passar de 'pendente' para um estado ativo (confirmada, em entrega, entregue), reduzimos o stock
    if (estadoAnterior === 'pendente' && (estado === 'confirmada' || estado === 'em entrega' || estado === 'entregue')) {

        // Se ainda não tem fatura, geramos uma ao confirmar/entregar
        if (!order.faturaNumero) {
            order.faturaNumero = await gerarNumeroFatura(supermercadoId);
            order.faturaData = new Date();

            // Snapshot dos dados do cliente no momento da faturação
            const cliente = await User.findById(order.clienteId);
            if (cliente) {
                order.clienteSnapshot = {
                    nome: cliente.nome,
                    nif: cliente.nif,
                    morada: cliente.morada,
                    email: cliente.email,
                    telefone: cliente.telefone
                };
            }
        }

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
                const pInfo = await Product.findById(item.produtoId);
                throw new Error(`Stock insuficiente para confirmar a encomenda: ${pInfo ? pInfo.nome : 'Produto desconhecido'}`);
            }
        }
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
        supermercadoId,
        clienteId: cliente._id,
        produtos: produtosEncomenda,
        valorTotal,
        metodoPagamento: 'dinheiro',
        estado: estadoFinal,
        metodoEntrega: metodoEntrega || 'levantamento em loja',
        moradaEntrega: eDomicilio ? moradaCliente : 'Venda Local em Loja',
        latitude: temCoordenadasValidas ? lat : undefined,
        longitude: temCoordenadasValidas ? lng : undefined,
        faturaNumero: await gerarNumeroFatura(supermercadoId),
        faturaData: new Date(),
        clienteSnapshot: {
            nome: cliente.nome,
            nif: cliente.nif,
            morada: cliente.morada,
            email: cliente.email,
            telefone: cliente.telefone
        }
    });

    return novaOrdem.save();
};

module.exports = supermarketService;
