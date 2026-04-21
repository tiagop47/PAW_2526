const Order = require('../models/OrderModel');
const Product = require('../models/ProductModel');
const Supermarket = require('../models/SupermarketModel');
const User = require('../models/UserModel');
const Coupon = require('../models/CupomModel');

const orderService = {};

orderService.criarEncomenda = async function (clienteId, dadosEncomenda) {
    const { supermercadoId, produtos, metodoEntrega, moradaEntrega, coordenadasEntrega, codigoCupao } = dadosEncomenda;

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

    const produtosEncomenda = [];
    let valorSubtotal = 0;

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
        valorSubtotal += produto.preco * item.quantidade;
    }

    let cupaoAplicado = null;
    let descontoValor = 0;

    if (codigoCupao) {
        const cupao = await Coupon.findOne({ codigo: codigoCupao.toUpperCase().trim(), ativo: true });
        
        if (!cupao) {
            throw new Error('Cupão inválido ou inativo.');
        }

        if (new Date(cupao.prazo) < new Date()) {
            throw new Error('Este cupão já expirou.');
        }

        if (cupao.supermercadoId && cupao.supermercadoId.toString() !== supermercadoId) {
            throw new Error('Este cupão não é válido para este supermercado.');
        }

        const cliente = await User.findById(clienteId);
        if (!cliente.cupoes.includes(cupao._id)) {
            throw new Error('Não tens este cupão disponível na tua conta.');
        }

        descontoValor = (valorSubtotal * cupao.percentagemDesconto) / 100;
        cupaoAplicado = cupao;
    }

    const valorTotalFinal = Math.max(0, valorSubtotal - descontoValor);

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
        valorTotal: valorTotalFinal,
        cupaoId: cupaoAplicado ? cupaoAplicado._id : undefined,
        descontoValor: descontoValor,
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

    const orderGuardada = await novaEncomenda.save();

    if (cupaoAplicado) {
        await User.findByIdAndUpdate(clienteId, {
            $pull: { cupoes: cupaoAplicado._id }
        });
    }

    return orderGuardada;
};

orderService.cancelarEncomenda = async function (clienteId, encomendaId) {
    const encomenda = await Order.findOne({ _id: encomendaId, clienteId });

    if (!encomenda) {
        throw new Error('Encomenda não encontrada.');
    }

    if (!['pendente', 'confirmada'].includes(encomenda.estado)) {
        throw new Error('Esta encomenda já não pode ser cancelada. Estado atual: ' + encomenda.estado);
    }

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
 * O cliente confirma que recebeu a encomenda (Estado Final).
 */
orderService.confirmarRececaoCliente = async function (clienteId, encomendaId) {
    const encomenda = await Order.findOne({ _id: encomendaId, clienteId });

    if (!encomenda) {
        throw new Error('Encomenda não encontrada.');
    }

    if (encomenda.estado !== 'em entrega') {
        throw new Error('Apenas encomendas em entrega podem ser confirmadas.');
    }

    encomenda.estado = 'entregue';
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

module.exports = orderService;
