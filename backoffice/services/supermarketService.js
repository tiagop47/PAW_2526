const Product = require('../models/ProductModel');
const Supermarket = require('../models/SupermarketModel');
const Order = require('../models/OrderModel');
const User = require('../models/UserModel');
const Avaliacao = require('../models/AvaliacaoModel');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const config = require('../config/config');

const Category = require('../models/CategoryModel');

const supermarketService = {};

supermarketService.obterDadosDashboard = async function (supermercadoId) {
    const [totalProdutos, totalEncomendas, encomendas, vendasStats, top5Produtos, avaliacaoStats, encomendasPendentes] = await Promise.all([
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
        ]),
        Avaliacao.aggregate([
            { $match: { supermercadoId: new mongoose.Types.ObjectId(supermercadoId) } },
            { $group: { _id: null, media: { $avg: '$notaSupermercado' }, total: { $sum: 1 } } }
        ]),
        Order.countDocuments({ supermercadoId, estado: { $in: ['pendente', 'aguarda_confirmacao'] } })
    ]);

    const vendasTotais = vendasStats.length > 0 ? vendasStats[0].total : 0;
    const valorMedio = totalEncomendas > 0 ? parseFloat((vendasTotais / totalEncomendas).toFixed(2)) : 0;

    return {
        totalProdutos,
        totalEncomendas,
        vendasTotais,
        valorMedio,
        encomendasPendentes,
        encomendas,
        top5Produtos,
        mediaAvaliacao: avaliacaoStats.length > 0 ? parseFloat(avaliacaoStats[0].media.toFixed(1)) : null,
        totalAvaliacoes: avaliacaoStats.length > 0 ? avaliacaoStats[0].total : 0
    };
};

supermarketService.getAllSupermercados = async function () {
    const supermercado = await Supermarket.find({ estadoAprovacao: 'Aprovado' }).select('_id nome descricao localizacao localizacaoGeo raioEntregaKm custoEntregaPorMetodo');
    return supermercado;
}

supermarketService.getSupermercado = async function (userId) {
    return Supermarket.findOne({ userId }).populate('userId', 'nif');
};

supermarketService.obterProdutos = async function (supermercadoId) {
    return Product.find({ supermercadoId }).populate('categoriaId');
};

/**
 * Obter um único produto pelo ID.
 * Se passar supermercadoId, garante que o produto pertence a esse supermercado (Segurança no Backoffice).
 */
supermarketService.obterProdutoPorId = async function (id, supermercadoId = null) {
    const filtro = { _id: id };
    if (supermercadoId) {
        filtro.supermercadoId = supermercadoId;
    }
    return Product.findOne(filtro).populate('categoriaId');
};

supermarketService.criarProduto = async function (supermercadoId, productData) {
    const novoProduto = new Product({
        supermercadoId: supermercadoId,
        nome: productData.nome,
        descricao: productData.descricao,
        categoriaId: productData.categoriaId,
        preco: productData.preco,
        precoAntigo: productData.precoAntigo || 0,
        stockDisponivel: productData.stockDisponivel,
        imagem: productData.imagem
    });

    novoProduto.codigoBarras = productData.codigoBarras && productData.codigoBarras.trim() !== ''
        ? productData.codigoBarras
        : novoProduto._id.toString();

    return novoProduto.save();
};

supermarketService.atualizarProduto = async function (supermercadoId, productId, updateData) {
    const camposParaAtualizar = {
        nome: updateData.nome,
        descricao: updateData.descricao,
        categoriaId: updateData.categoriaId,
        preco: updateData.preco,
        precoAntigo: updateData.precoAntigo || 0,
        stockDisponivel: updateData.stockDisponivel,
        codigoBarras: updateData.codigoBarras && updateData.codigoBarras.trim() !== '' ? updateData.codigoBarras : productId.toString()
    };


    if (updateData.imagem) {
        camposParaAtualizar.imagem = updateData.imagem;
    }

    return Product.findOneAndUpdate(
        { _id: productId, supermercadoId: supermercadoId },
        camposParaAtualizar,
        {
            returnDocument: 'after',
            runValidators: true,
            context: 'query'
        }
    );
};

supermarketService.eliminarProduto = async function (supermercadoId, productId) {
    return Product.findOneAndDelete({ _id: productId, supermercadoId });
};

/**
 * Listagem geral de produtos para o Frontoffice
 */
supermarketService.listarProdutosGeral = async function (supermercadoId) {
    const query = {};
    if (supermercadoId) {
        query.supermercadoId = supermercadoId;
    }
    return Product.find(query)
        .sort({ criadoEm: -1 })
        .populate('categoriaId', 'nome');
};

supermarketService.pesquisarProdutos = async function (supermercadoId, { q, categoriaId }) {
    const filtro = { supermercadoId };

    if (q) {
        filtro.$or = [
            { nome: { $regex: q, $options: 'i' } },
            { codigoBarras: { $regex: q, $options: 'i' } }
        ];
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
        const produto = await Product.findOne({ _id: item.produtoId, supermercadoId });

        const disponivel = produto ? produto.stockDisponivel : 0;
        const erro = !produto || disponivel < item.quantidade;

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

supermarketService.atualizarSupermercado = async function (supermercadoId, dadosSupermercado) {
    const { latitude, longitude, custoEntregaPorMetodo, raioEntregaKm } = dadosSupermercado;

    if (raioEntregaKm !== undefined) {
        dadosSupermercado.raioEntregaKm = parseInt(raioEntregaKm, 10) || 5;
    }

    if (latitude && longitude) {
        dadosSupermercado.localizacaoGeo = {
            type: 'Point',
            coordinates: [Number.parseFloat(longitude), Number.parseFloat(latitude)]
        };
    }

    if (custoEntregaPorMetodo) {
        // Se a chave não vier no req.body (input disabled), fica null no modelo
        dadosSupermercado.custoEntregaPorMetodo = {
            levantamento_loja: 0,
            entrega_domicilio: custoEntregaPorMetodo.entrega_domicilio !== undefined ? (parseFloat(custoEntregaPorMetodo.entrega_domicilio) || 0) : null
        };
    }

    return Supermarket.findByIdAndUpdate(supermercadoId, dadosSupermercado, { new: true, runValidators: true });
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

const transicoesPermitidas = {
    pendente:               ['confirmada', 'cancelada'],
    confirmada:             ['preparacao', 'cancelada'],
    preparacao:             ['em_entrega', 'cancelada'],
    em_entrega:             ['aguarda_confirmacao', 'cancelada'],
    aguarda_confirmacao:    ['entregue', 'cancelada'],
    entregue:               [],
    cancelada:              [],
};

supermarketService.transicoesPermitidas = transicoesPermitidas;

supermarketService.atualizarEstadoEncomenda = async function (supermercadoId, orderId, estado) {
    const order = await Order.findOne({ _id: orderId, supermercadoId });
    if (!order) {
        return null;
    }

    const estadoAnterior = order.estado;
    if (estadoAnterior === estado) {
        return order;
    }

    const permitidos = transicoesPermitidas[estadoAnterior] || [];
    if (!permitidos.includes(estado)) {
        throw new Error(`Transição de estado inválida: ${estadoAnterior} → ${estado}`);
    }

    const estadosComStockOcupado = ['pendente', 'confirmada', 'preparacao', 'em_entrega', 'aguarda_confirmacao', 'entregue'];
    const eraOcupado = estadosComStockOcupado.includes(estadoAnterior);
    const vaiSerOcupado = estadosComStockOcupado.includes(estado);

    if (vaiSerOcupado && !eraOcupado) {
        for (const item of order.produtos) {
            const produto = await Product.findOneAndUpdate(
                { _id: item.produtoId, stockDisponivel: { $gte: item.quantidade } },
                { $inc: { stockDisponivel: -item.quantidade } },
                { new: true }
            );

            if (!produto) {
                const pInfo = await Product.findById(item.produtoId);
                throw new Error(`Stock insuficiente: ${pInfo ? pInfo.nome : 'Produto desconhecido'}`);
            }
        }
    }

    if (eraOcupado && !vaiSerOcupado) {
        for (const item of order.produtos) {
            await Product.findByIdAndUpdate(item.produtoId, {
                $inc: { stockDisponivel: item.quantidade }
            });
        }
    }

    //Lógica de fatura: Gerar apenas se entrar num estado "avançado" e ainda não tiver
    const estadosComFatura = ['confirmada', 'preparacao', 'em_entrega', 'aguarda_confirmacao', 'entregue'];
    if (estadosComFatura.includes(estado) && !order.faturaNumero) {
        order.faturaNumero = await gerarNumeroFatura(supermercadoId);
        order.faturaData = new Date();

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

        if (cliente.role !== 'clientes') {
            throw new Error('Este email pertence a uma conta de ' + cliente.role + '. Apenas clientes podem realizar compras.');
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

    const eDomicilio = metodoEntrega === 'entrega_domicilio';
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
        metodoEntrega: metodoEntrega || 'levantamento_loja',
        moradaEntrega: eDomicilio ? moradaCliente : 'Venda Local em Loja',
        coordenadasEntrega: temCoordenadasValidas ? { lat, lng } : undefined,
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

module.exports = supermarketService;
