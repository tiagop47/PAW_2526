const Supermarket = require("../models/SupermarketModel");
const Order = require("../models/OrderModel");
const Avaliacao = require("../models/AvaliacaoModel");
const mongoose = require("mongoose");

const estafetaService = {};

/**
 * Obtém todos os dados necessários para o dashboard do estafeta.
 */
estafetaService.obterDadosDashboard = async (estafetaId) => {
    const [stats, locaisDistintos, entregas] = await Promise.all([
        obterEstatisticas(estafetaId),
        Supermarket.distinct("localizacao", { estadoAprovacao: 'Aprovado' }),
        estafetaService.obterEntregasDisponiveis()
    ]);

    const zonasTrabalho = locaisDistintos
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'pt'))
        .map(local => ({ value: local.toLowerCase(), label: local }));

    let mercadoLider = null;
    let max = 0;
    const contagem = {};

    entregas.forEach(e => {
        const m = e.supermercadoId;
        if (!m) return;
        contagem[m._id] = (contagem[m._id] || 0) + 1;
        if (contagem[m._id] > max) {
            max = contagem[m._id];
            mercadoLider = { nome: m.nome, localizacao: m.localizacao, total: max };
        }
    });

    return {
        stats: { ...stats, mercadoLider },
        zonasTrabalho
    };
};

estafetaService.obterEntregasDisponiveis = async () => {
    return Order.find({ estafetaId: null, estado: 'preparacao', metodoEntrega: 'entrega_domicilio' })
        .populate('supermercadoId', 'nome localizacao localizacaoGeo custoEntregaPorMetodo')
        .populate('clienteId', 'nome morada')
        .sort({ criadoEm: -1 });
};

estafetaService.obterEntregasPorConcelho = async (concelho) => {
    if (!concelho) return estafetaService.obterEntregasDisponiveis();

    const mercados = await Supermarket.find({ 
        localizacao: { $regex: new RegExp("^" + concelho + "$", "i") },
        estadoAprovacao: 'Aprovado' 
    }).select('_id');

    return Order.find({
        supermercadoId: { $in: mercados.map(s => s._id) },
        estafetaId: null,
        estado: 'preparacao',
        metodoEntrega: 'entrega_domicilio'
    })
        .populate('supermercadoId', 'nome localizacao localizacaoGeo custoEntregaPorMetodo')
        .populate('clienteId', 'nome morada')
        .sort({ criadoEm: -1 });
};

estafetaService.obterMinhasEntregas = async (estafetaId) => {
    return Order.find({ estafetaId, estado: { $in: ['em_entrega', 'entregue'] } })
        .populate('supermercadoId', 'nome localizacao localizacaoGeo')
        .populate('clienteId', 'nome morada')
        .sort({ criadoEm: -1 });
};

estafetaService.aceitarEntrega = async (encomendaId, estafetaId) => {
    const ativas = await Order.countDocuments({ estafetaId, estado: 'em_entrega' });
    if (ativas >= 1) {
        throw new Error('Já tens uma entrega em curso. Conclui-a antes de aceitar outra.');
    }

    // Operação atómica: só atualiza se estafetaId for null E estado for 'preparacao'
    const encomenda = await Order.findOneAndUpdate(
        { _id: encomendaId, estafetaId: null, estado: 'preparacao', metodoEntrega: 'entrega_domicilio' },
        { $set: { estafetaId: estafetaId, estado: 'em_entrega' } },
        { new: true }
    );

    if (!encomenda) {
        throw new Error('Esta entrega já não está disponível ou foi aceite por outro estafeta.');
    }

    return encomenda;
};

estafetaService.confirmarEntrega = async (encomendaId, estafetaId) => {
    const encomenda = await Order.findById(encomendaId);
    if (!encomenda || encomenda.estafetaId?.toString() !== estafetaId.toString() || encomenda.estado !== 'em_entrega') {
        throw new Error('Operação inválida para esta entrega');
    }

    encomenda.estado = 'aguarda_confirmacao';

    return encomenda.save();
};

estafetaService.obterEncomendaPorId = async (id) => {
    return Order.findById(id)
        .populate('supermercadoId', 'nome localizacao localizacaoGeo custoEntregaPorMetodo')
        .populate('clienteId', 'nome morada');
};

const obterEstatisticas = async (estafetaId) => {
    const [entregasRealizadas, entregasEmCurso, entregasDisponiveis, avaliacaoStats] = await Promise.all([
        Order.countDocuments({ estafetaId, estado: 'entregue' }),
        Order.countDocuments({ estafetaId, estado: 'em_entrega' }),
        Order.countDocuments({ estafetaId: null, estado: 'preparacao', metodoEntrega: 'entrega_domicilio' }),
        Avaliacao.aggregate([
            { $match: { estafetaId: new mongoose.Types.ObjectId(estafetaId), notaEstafeta: { $ne: null } } },
            { $group: { _id: null, media: { $avg: '$notaEstafeta' }, total: { $sum: 1 } } }
        ])
    ]);

    const ganhos = await Order.aggregate([
        { $match: { estafetaId: new mongoose.Types.ObjectId(estafetaId), estado: 'entregue' } },
        { $lookup: { from: 'supermarkets', localField: 'supermercadoId', foreignField: '_id', as: 'supermercado' } },
        { $unwind: { path: '$supermercado', preserveNullAndEmptyArrays: true } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$supermercado.custoEntregaPorMetodo.entrega_domicilio', 0] } } } }
    ]);

    const anoAtual = new Date().getFullYear();
    const evolucaoMensal = await Order.aggregate([
        {
            $match: {
                estafetaId: new mongoose.Types.ObjectId(estafetaId),
                estado: 'entregue',
                criadoEm: {
                    $gte: new Date(`${anoAtual}-01-01T00:00:00.000Z`),
                    $lte: new Date(`${anoAtual}-12-31T23:59:59.999Z`)
                }
            }
        },
        {
            $group: {
                _id: { $month: "$criadoEm" },
                entregas: { $sum: 1 }
            }
        },
        { $sort: { "_id": 1 } }
    ]);

    const mesesFormatados = Array.from({ length: 12 }, (_, i) => {
        const mesEncontrado = evolucaoMensal.find(e => e._id === (i + 1));
        return mesEncontrado ? mesEncontrado.entregas : 0;
    });

    return {
        entregasRealizadas,
        entregasEmCurso,
        entregasDisponiveis,
        ganhosTotais: ganhos.length > 0 ? ganhos[0].total : 0,
        evolucaoMensal: mesesFormatados,
        mediaAvaliacao: avaliacaoStats.length > 0 ? parseFloat(avaliacaoStats[0].media.toFixed(1)) : null,
        totalAvaliacoes: avaliacaoStats.length > 0 ? avaliacaoStats[0].total : 0
    };
};

module.exports = estafetaService;