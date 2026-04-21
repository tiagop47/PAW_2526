const Order = require('../models/OrderModel');
const Product = require('../models/ProductModel');
const Supermarket = require('../models/SupermarketModel');
const User = require('../models/UserModel');

const orderService = {};

orderService.criarEncomenda = async function (clienteId, dadosEncomenda) {
    const { supermercadoId, produtos, metodoEntrega, moradaEntrega, coordenadasEntrega } = dadosEncomenda;

    // Validar que o supermercado existe e está aprovado
    const supermercado = await Supermarket.findOne({ _id: supermercadoId, estadoAprovacao: 'Aprovado' });
    if (!supermercado) {
        throw new Error('Supermercado não encontrado ou não aprovado.');
    }

    if (!produtos || produtos.length === 0) {
        throw new Error('A encomenda deve ter pelo menos um produto.');
    }

    const produtoIds = produtos.map(p => p.produtoId);
    const produtosDB = await Product.find({ _id: { $in: produtoIds }, supermercadoId });

    if (produtosDB.length !== produtoIds.length) {
        throw new Error('Todos os produtos devem pertencer ao mesmo supermercado.');
    }

    // Regra d): Verificar stock disponível para cada produto
    const produtosEncomenda = [];
    let valorTotal = 0;

    for (const item of produtos) {
        const produto = produtosDB.find(p => p._id.toString() === item.produtoId);
        if (!produto) {
            throw new Error(`Produto ${item.produtoId} não encontrado.`);
        }

        if (produto.stockDisponivel < item.quantidade) {
            throw new Error(`Stock insuficiente para "${produto.nome}". Disponível: ${produto.stockDisponivel}, solicitado: ${item.quantidade}.`);
        }

        produtosEncomenda.push({
            produtoId: produto._id,
            quantidade: item.quantidade,
            precoUnitario: produto.preco
        });
        valorTotal += produto.preco * item.quantidade;
    }

    // Decrementar stock atomicamente
    for (const item of produtos) {
        const resultado = await Product.findOneAndUpdate(
            { _id: item.produtoId, stockDisponivel: { $gte: item.quantidade } },
            { $inc: { stockDisponivel: -item.quantidade } },
            { new: true }
        );

        if (!resultado) {
            // Reverter o stock já descontado
            for (const revertItem of produtos) {
                if (revertItem.produtoId === item.produtoId) break;
                await Product.findByIdAndUpdate(revertItem.produtoId, {
                    $inc: { stockDisponivel: revertItem.quantidade }
                });
            }
            const pInfo = await Product.findById(item.produtoId);
            throw new Error(`Stock insuficiente para "${pInfo ? pInfo.nome : 'produto desconhecido'}".`);
        }
    }

    // Obter snapshot do cliente
    const cliente = await User.findById(clienteId);

    const novaEncomenda = new Order({
        supermercadoId,
        clienteId,
        produtos: produtosEncomenda,
        valorTotal,
        estado: 'pendente',
        metodoEntrega: metodoEntrega || 'levantamento_loja',
        moradaEntrega: metodoEntrega === 'entrega_domicilio' ? (moradaEntrega || cliente.morada) : undefined,
        coordenadasEntrega: coordenadasEntrega || undefined,
        clienteSnapshot: cliente ? {
            nome: cliente.nome,
            nif: cliente.nif,
            morada: cliente.morada,
            email: cliente.email,
            telefone: cliente.telefone
        } : undefined
    });

    return novaEncomenda.save();
};

orderService.cancelarEncomenda = async function (clienteId, encomendaId) {
    const encomenda = await Order.findOne({ _id: encomendaId, clienteId });

    if (!encomenda) {
        throw new Error('Encomenda não encontrada.');
    }

    if (!['pendente', 'confirmada'].includes(encomenda.estado)) {
        throw new Error('Esta encomenda já não pode ser cancelada. Estado atual: ' + encomenda.estado);
    }

    // Regra b): Se confirmada, verificar se passaram menos de 5 minutos
    if (encomenda.estado === 'confirmada' && encomenda.confirmadaEm) {
        const agora = new Date();
        const diffMs = agora.getTime() - encomenda.confirmadaEm.getTime();
        const cincoMinutosMs = 5 * 60 * 1000;

        if (diffMs > cincoMinutosMs) {
            throw new Error('Já passaram mais de 5 minutos desde a confirmação. Não é possível cancelar.');
        }
    }

    // Repor o stock dos produtos
    for (const item of encomenda.produtos) {
        await Product.findByIdAndUpdate(item.produtoId, {
            $inc: { stockDisponivel: item.quantidade }
        });
    }

    encomenda.estado = 'cancelada';
    return encomenda.save();
};

/**
 * Listar encomendas do cliente.
 */
orderService.listarEncomendasCliente = async function (clienteId) {
    return Order.find({ clienteId })
        .populate('supermercadoId', 'nome localizacao')
        .populate({
            path: 'produtos.produtoId',
            select: 'nome imagem'
        })
        .sort({ criadoEm: -1 });
};

/**
 * Obter detalhes de uma encomenda do cliente.
 */
orderService.obterEncomendaCliente = async function (clienteId, encomendaId) {
    return Order.findOne({ _id: encomendaId, clienteId })
        .populate('supermercadoId', 'nome localizacao')
        .populate({
            path: 'produtos.produtoId',
            select: 'nome imagem preco'
        })
        .populate('estafetaId', 'nome telefone');
};

/**
 * Confirmar receção da encomenda pelo cliente.
 * Transição: aguarda_confirmacao → entregue
 */
orderService.confirmarRececao = async function (clienteId, encomendaId) {
    const encomenda = await Order.findOne({ _id: encomendaId, clienteId });

    if (!encomenda) {
        throw new Error('Encomenda não encontrada.');
    }

    if (encomenda.estado !== 'aguarda_confirmacao') {
        throw new Error('Esta encomenda não está a aguardar confirmação de entrega.');
    }

    encomenda.estado = 'entregue';
    return encomenda.save();
};

module.exports = orderService;
