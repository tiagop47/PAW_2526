const mongoose = require('mongoose');
const Order = require('../models/OrderModel');
const Product = require('../models/ProductModel');
const Supermarket = require('../models/SupermarketModel');
const User = require('../models/UserModel');
const Coupon = require('../models/CupomModel');
const Counter = require('../models/CounterModel');
const bcrypt = require('bcrypt');
const config = require('../config/config');

const orderService = {};

/**
 * Repõe o stock dos produtos de uma encomenda cancelada.
 * Centraliza a lógica usada por orderService e supermarketService.
 */
orderService.reporStock = async function (produtos) {
    for (const item of produtos) {
        await Product.findByIdAndUpdate(item.produtoId, { $inc: { stockDisponivel: item.quantidade } });
    }
};

/**
 * Função auxiliar para gerir o utilizador em vendas de balcão (POS).
 */
async function obterOuCriarConsumidorFinal(snapshot) {
    const emailFinal = snapshot?.email || 'consumidor.final@paw.com';
    const nifFinal = snapshot?.nif || undefined;

    let query = { email: emailFinal };
    if (nifFinal) {
        query = { $or: [{ email: emailFinal }, { nif: nifFinal }] };
    }

    let cliente = await User.findOne(query);

    if (!cliente) {
        const passwordTemp = config.DEFAULT_ADMIN_PASSWORD || 'ChangeMe123!';
        const hash = await bcrypt.hash(passwordTemp, config.SALT_ROUNDS || 10);

        cliente = await User.create({
            nome: snapshot?.nome || 'Consumidor Final',
            email: emailFinal,
            password: hash,
            telefone: snapshot?.telefone || '900000000',
            nif: nifFinal,
            morada: snapshot?.morada || 'Venda Local em Loja',
            role: 'clientes'
        });
    }
    return cliente._id;
}

/**
 * Gera um número de fatura sequencial e atómico.
 */
async function gerarNumeroFatura(supermercadoId) {
    const anoAtual = new Date().getFullYear();
    const counterId = `fatura_${supermercadoId}_${anoAtual}`;

    const counter = await Counter.findOneAndUpdate(
        { _id: counterId },
        { $inc: { seq: 1 } },
        { upsert: true, new: true }
    );

    const sequencial = counter.seq.toString().padStart(4, '0');
    return `FT ${anoAtual}/${sequencial}`;
}

orderService.criarEncomenda = async function (clienteId, dadosEncomenda) {
    let { supermercadoId, produtos, metodoEntrega, moradaEntrega, coordenadasEntrega, codigoCupao, origem, metodoPagamento } = dadosEncomenda;

    origem = origem || 'online';

    if (origem === 'caixa' && !clienteId) {
        clienteId = await obterOuCriarConsumidorFinal(dadosEncomenda.clienteSnapshot);
    }

    const supermercado = await Supermarket.findOne({ _id: supermercadoId, estadoAprovacao: 'Aprovado' });
    if (!supermercado) throw new Error('Supermercado não encontrado ou não aprovado.');

    // Validação de Raio de Entrega
    if (metodoEntrega === 'entrega_domicilio') {
        if (!coordenadasEntrega[0] || !coordenadasEntrega[1]) {
            throw new Error('Coordenadas de entrega são obrigatórias para entrega ao domicílio.');
        }

        const dist = calcularDistancia(
            supermercado.localizacaoGeo.coordinates[1],
            supermercado.localizacaoGeo.coordinates[0],
        );

        if (dist > supermercado.raioEntregaKm) {
            throw new Error(`A morada está fora do raio de alcance (${supermercado.raioEntregaKm}km). Distância: ${dist.toFixed(2)}km.`);
        }
    }

    if (!produtos || produtos.length === 0) {
        throw new Error('A encomenda deve ter pelo menos um produto.');
    }

    const produtoIds = produtos.map(p => p.produtoId);
    const produtosDB = await Product.find({ _id: { $in: produtoIds }, supermercadoId });

    if (produtosDB.length !== produtoIds.length) throw new Error('Produtos inválidos ou de lojas diferentes.');

    const produtosEncomenda = [];
    let valorSubtotal = 0;
    let valorTotalIVA = 0;

    for (const item of produtos) {
        const produto = produtosDB.find(p => p._id.toString() === item.produtoId);
        if (produto.stockDisponivel < item.quantidade) {
            throw new Error(`Stock insuficiente para "${produto.nome}". Disponível: ${produto.stockDisponivel}.`);
        }

        const precoComIVA = produto.preco;
        const taxaIVA = produto.iva || 23;
        const valorIVAUnitario = precoComIVA - (precoComIVA / (1 + taxaIVA / 100));

        produtosEncomenda.push({
            produtoId: produto._id,
            quantidade: item.quantidade,
            precoUnitario: precoComIVA,
            ivaTaxa: taxaIVA
        });

        valorSubtotal += precoComIVA * item.quantidade;
        valorTotalIVA += valorIVAUnitario * item.quantidade;
    }

    let descontoValor = 0;
    let cupaoAplicado = null;
    if (codigoCupao) {
        const cupao = await Coupon.findOne({ codigo: codigoCupao.toUpperCase().trim(), ativo: true });
        if (cupao && new Date(cupao.prazo) >= new Date() && (!cupao.supermercadoId || cupao.supermercadoId.toString() === supermercadoId)) {
            descontoValor = (valorSubtotal * cupao.percentagemDesconto) / 100;
            cupaoAplicado = cupao;
        }
    }

    const valorProdutosFinal = Math.max(0, valorSubtotal - descontoValor);
    const taxaEntrega = metodoEntrega === 'entrega_domicilio'
        ? (supermercado.custoEntregaPorMetodo?.entrega_domicilio || 0)
        : (supermercado.custoEntregaPorMetodo?.levantamento_loja || 0);

    const valorTotalFinal = valorProdutosFinal + taxaEntrega;

    // Transação atómica: abate de stock + criação da encomenda + remoção de cupão
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        for (const item of produtos) {
            const res = await Product.findOneAndUpdate(
                { _id: item.produtoId, stockDisponivel: { $gte: item.quantidade } },
                { $inc: { stockDisponivel: -item.quantidade } },
                { session }
            );
            if (!res) throw new Error('Falha no abate de stock.');
        }

        const cliente = await User.findById(clienteId).session(session);
        const novaEncomenda = new Order({
            supermercadoId,
            clienteId,
            produtos: produtosEncomenda,
            valorProdutos: valorProdutosFinal,
            valorTotal: valorTotalFinal,
            valorTotalIVA,
            taxaEntrega,
            metodoPagamento: metodoPagamento || (origem === 'caixa' ? 'dinheiro' : 'online'),
            cupaoId: cupaoAplicado?._id,
            descontoValor,
            estado: origem === 'caixa' ? 'confirmada' : 'pendente',
            confirmadaEm: origem === 'caixa' ? new Date() : undefined,
            origem,
            metodoEntrega: metodoEntrega || (origem === 'caixa' ? 'levantamento_loja' : 'levantamento_loja'),
            moradaEntrega: metodoEntrega === 'entrega_domicilio' ? (moradaEntrega || cliente.morada) : undefined,
            coordenadasEntrega: metodoEntrega === 'entrega_domicilio' ? coordenadasEntrega : undefined,
            faturaNumero: origem === 'caixa' ? await gerarNumeroFatura(supermercadoId) : undefined,
            faturaData: origem === 'caixa' ? new Date() : undefined,
            clienteSnapshot: {
                nome: cliente.nome, nif: cliente.nif, morada: cliente.morada, email: cliente.email, telefone: cliente.telefone
            }
        });

        const guardada = await novaEncomenda.save({ session });
        if (cupaoAplicado) await User.findByIdAndUpdate(clienteId, { $pull: { cupoes: cupaoAplicado._id } }, { session });

        // Gerar código de levantamento se for levantamento em loja
        if (guardada.metodoEntrega === 'levantamento_loja') {
            const codigo = Math.floor(100000 + Math.random() * 900000).toString();
            guardada.codigoLevantamento = codigo;
            await guardada.save({ session });

            // Enviar email com o código
            const emailService = require('./emailService');
            emailService.enviarEmailCodigoLevantamento(
                guardada.clienteSnapshot.email,
                guardada.clienteSnapshot.nome,
                codigo,
                supermercado.nome
            ).catch(err => console.error('Erro ao enviar email de levantamento:', err));
        }

        await session.commitTransaction();

        // Emitir notificação via Socket.io
        try {
            const socketModule = require('../config/socket');
            const io = socketModule.getIO();

            // Notifica o cliente sobre o código via Socket
            if (guardada.metodoEntrega === 'levantamento_loja') {
                io.to(`user_${clienteId}`).emit('codigo-levantamento', {
                    encomendaId: guardada._id,
                    codigo: guardada.codigoLevantamento,
                    mensagem: `O teu código para levantamento no ${supermercado.nome} é: ${guardada.codigoLevantamento}`
                });
            }
            // Notifica o supermercado específico
            io.to(`supermarket_${supermercadoId}`).emit('nova-encomenda', {
                encomendaId: guardada._id,
                cliente: guardada.clienteSnapshot.nome,
                valorTotal: guardada.valorTotal
            });
            // Notifica também o admin se necessário, ou emite globalmente
            io.emit('notificacao-geral', { message: `Nova encomenda realizada para o supermercado ${supermercado.nome}` });
        } catch (socketErr) {
            console.error('Erro ao emitir socket:', socketErr);
        }

        return guardada;
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
};

orderService.cancelarEncomenda = async function (encomenda) {
    if (!['pendente', 'em_preparacao', 'confirmada'].includes(encomenda.estado)) {
        throw new Error('Cancelamento não permitido neste estado.');
    }

    // Regra dos 5 minutos após FAZER a encomenda (criadoEm)
    const agora = new Date();
    const dataCriacao = new Date(encomenda.criadoEm);
    const diffMinutos = (agora - dataCriacao) / (1000 * 60);

    if (diffMinutos > 5) {
        throw new Error('Já passaram mais de 5 minutos desde que realizou a encomenda. Não é possível cancelar.');
    }

    await orderService.reporStock(encomenda.produtos);

    encomenda.estado = 'cancelada';
    const guardada = await encomenda.save();

    // Notificar o supermercado que a encomenda foi cancelada
    try {
        const socketModule = require('../config/socket');
        const io = socketModule.getIO();
        io.to(`supermarket_${encomenda.supermercadoId}`).emit('encomenda-cancelada', {
            encomendaId: encomenda._id,
            mensagem: `A encomenda de ${encomenda.clienteSnapshot.nome} foi cancelada pelo cliente.`
        });
    } catch (socketErr) {
        console.error('Erro ao emitir socket de cancelamento:', socketErr);
    }

    return guardada;
};

orderService.confirmarRececaoCliente = async function (encomenda) {
    if (encomenda.estado !== 'aguarda_validacao') {
        throw new Error('Encomenda não disponível para confirmação de receção.');
    }
    encomenda.estado = 'entregue';
    return encomenda.save();
};

orderService.listarEncomendasCliente = async function (clienteId) {
    return Order.find({ clienteId })
        .populate('supermercadoId', 'nome localizacao')
        .populate({
            path: 'produtos.produtoId',
            select: 'nome imagem'
        })
        .sort({ criadoEm: -1 });
};

orderService.obterEstatisticasCliente = async function (clienteId) {
    const stats = await Order.aggregate([
        { $match: { clienteId: new mongoose.Types.ObjectId(clienteId) } },
        {
            $facet: {
                total: [{ $count: 'count' }],
                maisComprados: [
                    { $unwind: '$produtos' },
                    { $group: { _id: '$produtos.produtoId', total: { $sum: '$produtos.quantidade' } } },
                    { $sort: { total: -1 } },
                    { $limit: 5 },
                    { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'info' } },
                    { $unwind: '$info' },
                    { $project: { nome: '$info.nome', imagem: '$info.imagem', totalQuantidade: '$total' } }
                ]
            }
        }
    ]);

    return {
        totalEncomendas: stats[0].total[0]?.count || 0,
        produtosMaisComprados: stats[0].maisComprados
    };
};

function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

module.exports = orderService;
