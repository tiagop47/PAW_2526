const Supermarket = require("../models/SupermarketModel");
const Order = require("../models/OrderModel");
const Avaliacao = require("../models/AvaliacaoModel");
const mongoose = require("mongoose");

const estafetaService = {};

/**
 * Obtém todos os dados necessários para o dashboard do estafeta.
 */
estafetaService.obterDadosDashboard = async function (estafetaId) {
    const [stats, zonasBrutas, entregas] = await Promise.all([
        obterEstatisticas(estafetaId),
        Supermarket.distinct("localizacao", { estadoAprovacao: 'Aprovado' }),
        estafetaService.obterEntregasDisponiveis()
    ]);

    const zonasObjeto = {};
    zonasBrutas.forEach(function (z) {
        var zona = (z || '').trim();
        if (zona) {
            zonasObjeto[zona.toLowerCase()] = zona;
        }
    });

    var zonasTrabalho = Object.keys(zonasObjeto)
        .sort(function (a, b) { return zonasObjeto[a].localeCompare(zonasObjeto[b], 'pt'); })
        .map(function (key) { return { value: key, label: zonasObjeto[key] }; });

    var contagem = {};
    var zonaMaisPopular = null;
    var totalZonaPopular = 0;

    entregas.forEach(function (e) {
        var zona = e.supermercadoId && e.supermercadoId.localizacao;
        if (zona) {
            contagem[zona] = (contagem[zona] || 0) + 1;
            if (contagem[zona] > totalZonaPopular) {
                totalZonaPopular = contagem[zona];
                zonaMaisPopular = zona;
            }
        }
    });

    return {
        stats: {
            entregasRealizadas: stats.entregasRealizadas,
            entregasEmCurso: stats.entregasEmCurso,
            entregasDisponiveis: stats.entregasDisponiveis,
            ganhosTotais: stats.ganhosTotais,
            evolucaoMensal: stats.evolucaoMensal,
            zonaMaisPopular: zonaMaisPopular,
            totalZonaPopular: totalZonaPopular,
            mediaAvaliacao: stats.mediaAvaliacao,
            totalAvaliacoes: stats.totalAvaliacoes
        },
        zonasTrabalho: zonasTrabalho
    };
};

estafetaService.obterEntregasDisponiveis = async function () {
    return Order.find({ estafetaId: null, estado: 'confirmada' })
        .populate('supermercadoId', 'nome localizacao localizacaoGeo custoEntregaPorMetodo')
        .populate('clienteId', 'nome morada')
        .sort({ criadoEm: -1 });
};

estafetaService.obterEntregasPorConcelho = async function (concelho) {
    if (!concelho) return estafetaService.obterEntregasDisponiveis();

    const mercados = await Supermarket.find({ 
        localizacao: { $regex: new RegExp("^" + concelho + "$", "i") },
        estadoAprovacao: 'Aprovado' 
    }).select('_id');

    return Order.find({
        supermercadoId: { $in: mercados.map(s => s._id) },
        estafetaId: null,
        estado: 'confirmada'
    })
        .populate('supermercadoId', 'nome localizacao localizacaoGeo custoEntregaPorMetodo')
        .populate('clienteId', 'nome morada')
        .sort({ criadoEm: -1 });
};

estafetaService.obterMinhasEntregas = async function (estafetaId) {
    return Order.find({ estafetaId, estado: { $in: ['em_entrega', 'aguarda_confirmacao', 'entregue'] } })
        .populate('supermercadoId', 'nome localizacao localizacaoGeo')
        .populate('clienteId', 'nome morada')
        .sort({ criadoEm: -1 });
};

estafetaService.aceitarEntrega = async function (encomendaId, estafetaId) {
    const ativas = await Order.countDocuments({ estafetaId, estado: 'em_entrega' });
    if (ativas >= 1) {
        throw new Error('Já tens uma entrega em curso. Conclui-a antes de aceitar outra.');
    }

    // Operação atómica: só atualiza se estafetaId for null E estado for 'confirmada'
    const encomenda = await Order.findOneAndUpdate(
        { _id: encomendaId, estafetaId: null, estado: 'confirmada' },
        { $set: { estafetaId: estafetaId, estado: 'em_entrega' } },
        { new: true }
    );

    if (!encomenda) {
        throw new Error('Esta entrega já não está disponível ou foi aceite por outro estafeta.');
    }

    return encomenda;
};

estafetaService.confirmarEntrega = async function (encomendaId, estafetaId) {
    const encomenda = await Order.findById(encomendaId);
    if (!encomenda || encomenda.estafetaId?.toString() !== estafetaId.toString() || encomenda.estado !== 'em_entrega') {
        throw new Error('Operação inválida para esta entrega');
    }

    encomenda.estado = 'aguarda_confirmacao';

    return encomenda.save();
};

estafetaService.obterEncomendaPorId = async function (id) {
    return Order.findById(id)
        .populate('supermercadoId', 'nome localizacao localizacaoGeo custoEntregaPorMetodo')
        .populate('clienteId', 'nome morada');
};

async function obterEstatisticas(estafetaId) {
    const [entregasRealizadas, entregasEmCurso, entregasDisponiveis, avaliacaoStats] = await Promise.all([
        Order.countDocuments({ estafetaId, estado: 'entregue' }),
        Order.countDocuments({ estafetaId, estado: 'em_entrega' }),
        Order.countDocuments({ estafetaId: null, estado: 'confirmada' }),
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