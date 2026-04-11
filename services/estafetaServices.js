const Supermarket = require("../models/SupermarketModel");
const Order = require("../models/OrderModel");
const mongoose = require("mongoose");

const estafetaService = {};

estafetaService.obterEstatisticas = async function (estafetaId) {
    const [entregasRealizadas, entregasEmCurso, entregasDisponiveis] = await Promise.all([
        Order.countDocuments({ estafetaId, estado: 'entregue' }),
        Order.countDocuments({ estafetaId, estado: 'em entrega' }),
        Order.countDocuments({ estafetaId: null, estado: 'confirmada' })
    ]);

    const ganhos = await Order.aggregate([
        { $match: { estafetaId: new mongoose.Types.ObjectId(estafetaId), estado: 'entregue' } },
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
    return Order.find({ estafetaId: null, estado: 'confirmada' })
        .populate('supermercadoId', 'nome localizacao localizacaoGeo custoEntrega raioAtuacao')
        .populate('clienteId', 'nome morada')
        .sort({ criadoEm: -1 });
};

estafetaService.obterSupermercadosCoberturaPorLocalizacao = async function (lat, lng) {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) throw new Error('Coordenadas inválidas');

    return Supermarket.aggregate([
        {
            $geoNear: {
                near: { type: 'Point', coordinates: [lngNum, latNum] },
                distanceField: 'distanciaAtual',
                spherical: true,
                query: { estadoAprovacao: 'Aprovado' }
            }
        },
        {
            $project: {
                _id: 1, nome: 1, localizacaoGeo: 1, custoEntrega: 1, raioAtuacao: 1,
                distanciaAtualKm: { $divide: ['$distanciaAtual', 1000] }
            }
        },
        { $match: { $expr: { $lte: ['$distanciaAtualKm', '$raioAtuacao'] } } }
    ]);
};

estafetaService.obterEntregasPorLocalizacao = async function (lat, lng) {
    const mercados = await estafetaService.obterSupermercadosCoberturaPorLocalizacao(lat, lng);
    return Order.find({
        supermercadoId: { $in: mercados.map(s => s._id) },
        estafetaId: null,
        estado: 'confirmada'
    })
        .populate('supermercadoId', 'nome localizacao localizacaoGeo custoEntrega raioAtuacao')
        .populate('clienteId', 'nome morada')
        .sort({ criadoEm: -1 });
};

estafetaService.obterMinhasEntregas = async function (estafetaId) {
    return Order.find({ estafetaId, estado: { $in: ['em entrega', 'entregue'] } })
        .populate('supermercadoId', 'nome localizacao localizacaoGeo')
        .populate('clienteId', 'nome morada')
        .sort({ criadoEm: -1 });
};

estafetaService.aceitarEntrega = async function (encomendaId, estafetaId) {
    const ativas = await Order.countDocuments({ estafetaId, estado: 'em entrega' });
    if (ativas >= 1) {
        throw new Error('Atingiu o limite de 1 entrega em curso.');
    }

    // Operação atómica: só atualiza se estafetaId for null E estado for 'confirmada'
    const encomenda = await Order.findOneAndUpdate(
        { _id: encomendaId, estafetaId: null, estado: 'confirmada' },
        { $set: { estafetaId: estafetaId, estado: 'em entrega' } },
        { new: true }
    );

    if (!encomenda) {
        throw new Error('Esta entrega já não está disponível ou foi aceite por outro estafeta.');
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

estafetaService.obterSupermercadosAtivos = async function () {
    return Supermarket.find({ estadoAprovacao: 'Aprovado' })
        .select('nome localizacao localizacaoGeo raioAtuacao custoEntrega');
};

estafetaService.obterEncomendaPorId = async function (id) {
    return Order.findById(id)
        .populate('supermercadoId', 'nome localizacao localizacaoGeo custoEntrega raioAtuacao')
        .populate('clienteId', 'nome morada');
};

module.exports = estafetaService;