const Supermarket = require("../models/SupermarketModel");
const Order = require("../models/OrderModel");

const estafetaService = {};

estafetaService.obterEstatisticas = async function (estafetaId) {
    const [entregasRealizadas, entregasEmCurso, entregasDisponiveis] = await Promise.all([
        Order.countDocuments({ estafetaId, estado: 'entregue' }),
        Order.countDocuments({ estafetaId, estado: 'em entrega' }),
        Order.countDocuments({
            estafetaId: null,
            estado: 'confirmada',
            metodoEntrega: { $ne: 'levantamento em loja' }
        })
    ]);

    const ganhos = await Order.aggregate([
        { $match: { estafetaId: estafetaId, estado: 'entregue' } },
        { $lookup: { from: 'supermarkets', localField: 'supermercadoId', foreignField: '_id', as: 'supermercado' } },
        { $unwind: { path: '$supermercado', preserveNullAndEmptyArrays: true } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$supermercado.custoEntrega', 0] } } } }
    ]);

    return {
        entregasRealizadas,
        entregasEmCurso,
        entregasDisponiveis,
        ganhosTotais: ganhos.length > 0 ? ganhos[0].total : 0
    };
};

estafetaService.obterEntregasDisponiveis = async function () {
    return Order.find({
        estafetaId: null,
        estado: 'confirmada',
        metodoEntrega: { $ne: 'levantamento em loja' }
    })
        .populate('supermercadoId', 'nome localizacao localizacaoGeo custoEntrega raioAtuacao')
        .populate('clienteId', 'nome morada')
        .sort({ criadoEm: -1 });
};

/**
 * Filtra encomendas disponíveis que estejam dentro do raio de atuação do supermercado,
 * relativa à posição atual do estafeta.
 */
estafetaService.obterEntregasPorLocalizacao = async function (lat, lng) {
    const supermercadosNoRaio = await Supermarket.aggregate([
        {
            $geoNear: {
                near: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
                distanceField: "distanciaAtual",
                spherical: true,
                query: { estadoAprovacao: 'Aprovado' }
            }
        },
        {
            $project: {
                _id: 1,
                nome: 1,
                raioAtuacao: 1,
                distanciaAtualKm: { $divide: ["$distanciaAtual", 1000] } // Converte metros para Km
            }
        },
        {
            $match: {
                $expr: { $lte: ["$distanciaAtualKm", "$raioAtuacao"] }
            }
        }
    ]);

    const idsSupermercados = supermercadosNoRaio.map(s => s._id);

    return Order.find({
        supermercadoId: { $in: idsSupermercados },
        estafetaId: null,
        estado: 'confirmada',
        metodoEntrega: { $ne: 'levantamento em loja' }
    })
        .populate('supermercadoId', 'nome localizacao localizacaoGeo custoEntrega raioAtuacao')
        .populate('clienteId', 'nome morada')
        .sort({ criadoEm: -1 });
};

estafetaService.obterMinhasEntregas = async function (estafetaId) {
    return Order.find({
        estafetaId,
        estado: { $in: ['em entrega', 'entregue'] }
    })
        .populate('supermercadoId', 'nome localizacao localizacaoGeo')
        .populate('clienteId', 'nome morada')
        .sort({ criadoEm: -1 });
};

estafetaService.aceitarEntrega = async function (encomendaId, estafetaId) {
    const encomenda = await Order.findById(encomendaId);

    if (!encomenda) {
        throw new Error('Encomenda não encontrada');
    }

    if (encomenda.estafetaId) {
        throw new Error('Esta entrega já foi aceite por outro estafeta');
    }

    if (encomenda.estado !== 'confirmada') {
        throw new Error('Esta encomenda não está disponível para entrega');
    }

    encomenda.estafetaId = estafetaId;
    encomenda.estado = 'em entrega';
    await encomenda.save();

    return encomenda;
};

estafetaService.confirmarEntrega = async function (encomendaId, estafetaId) {
    const encomenda = await Order.findById(encomendaId);

    if (!encomenda) {
        throw new Error('Encomenda não encontrada');
    }

    if (encomenda.estafetaId.toString() !== estafetaId.toString()) {
        throw new Error('Esta entrega não pertence a este estafeta');
    }

    if (encomenda.estado !== 'em entrega') {
        throw new Error('Esta encomenda não está em entrega');
    }

    encomenda.estado = 'entregue';
    await encomenda.save();

    return encomenda;
};

estafetaService.obterSupermercadosAtivos = async function () {
    return Supermarket.find({
        estadoAprovacao: 'Aprovado',
        localizacaoGeo: { $exists: true }
    }).select('nome localizacao localizacaoGeo raioAtuacao custoEntrega');
};

module.exports = estafetaService;
