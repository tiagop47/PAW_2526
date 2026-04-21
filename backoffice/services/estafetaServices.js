const Supermarket = require("../models/SupermarketModel");
const Order = require("../models/OrderModel");
const Avaliacao = require("../models/AvaliacaoModel");
const mongoose = require("mongoose");

const estafetaService = {};

/**
 * Obtém todos os dados necessários para o dashboard do estafeta.
 */
estafetaService.obterDadosDashboard = async function (estafetaId) {
    const [stats, entregas, supermercados] = await Promise.all([
        obterEstatisticas(estafetaId),
        estafetaService.obterEntregasDisponiveis(),
        Supermarket.find({ estadoAprovacao: 'Aprovado' }).select('_id nome localizacao')
    ]);

    const contagem = {};
    let mercadoLider = null;
    let max = 0;

    entregas.forEach(function (e) {
        const mercado = e.supermercadoId;
        if (!mercado) {
            return;
        }

        contagem[mercado._id] = (contagem[mercado._id] || 0) + 1;
        if (contagem[mercado._id] > max) {
            max = contagem[mercado._id];
            mercadoLider = { nome: mercado.nome, localizacao: mercado.localizacao, total: max };
        }
    });

    stats.entregasDisponiveis = entregas.length;

    const zonasTrabalho = Array.from(new Set(supermercados.map(s => s.localizacao?.trim()).filter(Boolean)))
        .sort(function (a, b) { return a.localeCompare(b, 'pt'); })
        .map(function (local) {
            return { value: local.toLowerCase(), label: local };
        });

    return {
        stats: {
            entregasRealizadas: stats.entregasRealizadas,
            entregasEmCurso: stats.entregasEmCurso,
            entregasDisponiveis: stats.entregasDisponiveis,
            ganhosTotais: stats.ganhosTotais,
            evolucaoMensal: stats.evolucaoMensal,
            mediaAvaliacao: stats.mediaAvaliacao,
            totalAvaliacoes: stats.totalAvaliacoes,
            mercadoLider: mercadoLider
        },
        zonasTrabalho: zonasTrabalho
    };
};

/**
 * Método unificado para obter entregas disponíveis, opcionalmente filtradas por concelho.
 */
estafetaService.obterEntregasDisponiveis = async function (concelho = null) {
    const filtro = {
        estafetaId: null,
        estado: 'confirmada',
        metodoEntrega: 'entrega_domicilio'
    };

    if (concelho) {
        const mercados = await Supermarket.find({
            localizacao: { $regex: new RegExp("^" + concelho + "$", "i") },
            estadoAprovacao: 'Aprovado'
        }).select('_id');
        filtro.supermercadoId = { $in: mercados.map(function (s) { return s._id; }) };
    }

    return Order.find(filtro)
        .populate('supermercadoId', 'nome localizacao custoEntregaPorMetodo')
        .populate('clienteId', 'nome morada')
        .sort({ criadoEm: -1 });
};

estafetaService.obterMinhasEntregas = async function (estafetaId) {
    return Order.find({ estafetaId, estado: { $in: ['em entrega', 'aguarda validação', 'entregue'] } })
        .populate('supermercadoId', 'nome localizacao')
        .populate('clienteId', 'nome morada')
        .sort({ criadoEm: -1 });
};

estafetaService.aceitarEntrega = async function (encomendaId, estafetaId) {
    const ativas = await Order.countDocuments({ estafetaId, estado: 'em entrega' });
    if (ativas >= 1) {
        throw new Error('Já tens uma entrega em curso. Conclui-a antes de aceitar outra.');
    }

    const encomenda = await Order.findOneAndUpdate(
        { _id: encomendaId, estafetaId: null, estado: 'confirmada', metodoEntrega: 'entrega_domicilio' },
        { $set: { estafetaId: estafetaId, estado: 'em entrega' } },
        { new: true }
    );

    if (!encomenda) {
        throw new Error('Esta entrega já não está disponível.');
    }

    return encomenda;
};

estafetaService.confirmarEntrega = async function (encomendaId, estafetaId) {
    const encomenda = await Order.findById(encomendaId);
    if (!encomenda || encomenda.estafetaId?.toString() !== estafetaId.toString() || encomenda.estado !== 'em entrega') {
        throw new Error('Operação inválida para esta entrega');
    }

    encomenda.estado = 'entregue';

    return encomenda.save();
};

estafetaService.obterEncomendaPorId = async function (id) {
    return Order.findById(id)
        .populate('supermercadoId', 'nome localizacao custoEntregaPorMetodo')
        .populate('clienteId', 'nome morada');
};

async function obterEstatisticas(estafetaId) {
    const [entregasRealizadas, entregasEmCurso, avaliacaoStats] = await Promise.all([
        Order.countDocuments({ estafetaId, estado: 'entregue' }),
        Order.countDocuments({ estafetaId, estado: 'em entrega' }),
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

    const mesesFormatados = Array.from({ length: 12 }, function (_, i) {
        const mesEncontrado = evolucaoMensal.find(function (e) { return e._id === (i + 1); });
        return mesEncontrado ? mesEncontrado.entregas : 0;
    });

    return {
        entregasRealizadas: entregasRealizadas,
        entregasEmCurso: entregasEmCurso,
        ganhosTotais: ganhos.length > 0 ? ganhos[0].total : 0,
        evolucaoMensal: mesesFormatados,
        mediaAvaliacao: avaliacaoStats.length > 0 ? parseFloat(avaliacaoStats[0].media.toFixed(1)) : null,
        totalAvaliacoes: avaliacaoStats.length > 0 ? avaliacaoStats[0].total : 0
    };
};

module.exports = estafetaService;