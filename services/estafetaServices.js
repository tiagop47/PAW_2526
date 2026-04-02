const Supermarket = require("../models/SupermarketModel");
const Order = require("../models/OrderModel");
const mongoose = require("mongoose");

const estafetaService = {};

const normalizarRaioKm = function (valor) {
    const numero = Number(valor);
    if (!Number.isFinite(numero) || numero <= 0) return 5;

    const emKm = numero > 100 ? numero / 1000 : numero;
    return Math.min(Math.max(emKm, 1), 50);
};

const normalizarRaioSupermercado = function (supermercado) {
    if (!supermercado) return supermercado;
    supermercado.raioAtuacao = normalizarRaioKm(supermercado.raioAtuacao);
    return supermercado;
};

const normalizarRaioEntregas = function (entregas) {
    entregas.forEach(entrega => {
        if (entrega && entrega.supermercadoId) {
            normalizarRaioSupermercado(entrega.supermercadoId);
        }
    });
    return entregas;
};

estafetaService.obterEstatisticas = async function (estafetaId) {
    const [entregasRealizadas, entregasEmCurso, entregasDisponiveis] = await Promise.all([
        Order.countDocuments({ estafetaId, estado: 'entregue' }),
        Order.countDocuments({ estafetaId, estado: 'em entrega' }),
        Order.countDocuments({
            estafetaId: null,
            estado: 'confirmada'
        })
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
    const entregas = await Order.find({
        estafetaId: null,
        estado: 'confirmada'
    })
        .populate('supermercadoId', 'nome localizacao localizacaoGeo custoEntrega raioAtuacao')
        .populate('clienteId', 'nome morada')
        .sort({ criadoEm: -1 });

    return normalizarRaioEntregas(entregas);
};

estafetaService.obterSupermercadosCoberturaPorLocalizacao = async function (lat, lng) {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
        throw new Error('Coordenadas inválidas');
    }

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
                _id: 1,
                nome: 1,
                localizacaoGeo: 1,
                custoEntrega: 1,
                raioAtuacao: 1,
                distanciaAtualKm: { $divide: ['$distanciaAtual', 1000] }
            }
        },
        {
            $match: {
                $expr: {
                    $lte: [
                        '$distanciaAtualKm',
                        {
                            $cond: [
                                { $gt: ['$raioAtuacao', 100] },
                                { $divide: ['$raioAtuacao', 1000] },
                                '$raioAtuacao'
                            ]
                        }
                    ]
                }
            }
        },
        {
            $project: {
                _id: 1,
                nome: 1,
                localizacaoGeo: 1,
                custoEntrega: 1,
                raioAtuacao: {
                    $cond: [
                        { $gt: ['$raioAtuacao', 100] },
                        { $divide: ['$raioAtuacao', 1000] },
                        '$raioAtuacao'
                    ]
                },
                distanciaAtualKm: 1
            }
        }
    ]);
};

/**
 * Filtra encomendas disponíveis que estejam dentro do raio de atuação do supermercado,
 * relativa à posição atual do estafeta.
 */
estafetaService.obterEntregasPorLocalizacao = async function (lat, lng) {
    const supermercadosNoRaio = await estafetaService.obterSupermercadosCoberturaPorLocalizacao(lat, lng);

    const idsSupermercados = supermercadosNoRaio.map(s => s._id);

    const entregas = await Order.find({
        supermercadoId: { $in: idsSupermercados },
        estafetaId: null,
        estado: 'confirmada'
    })
        .populate('supermercadoId', 'nome localizacao localizacaoGeo custoEntrega raioAtuacao')
        .populate('clienteId', 'nome morada')
        .sort({ criadoEm: -1 });

    return normalizarRaioEntregas(entregas);
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
    // 1. Verificar se o estafeta já atingiu o limite de encomendas em curso (ex: 3)
    const LIMITE_ENTREGAS = 3;
    const entregasAtivas = await Order.countDocuments({
        estafetaId,
        estado: 'em entrega'
    });

    if (entregasAtivas >= LIMITE_ENTREGAS) {
        throw new Error(`Atingiu o limite de ${LIMITE_ENTREGAS} entregas em curso. Finalize as atuais antes de aceitar novas.`);
    }

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
    const supermercados = await Supermarket.find({
        estadoAprovacao: 'Aprovado',
        localizacaoGeo: { $exists: true }
    }).select('nome localizacao localizacaoGeo raioAtuacao custoEntrega');

    return supermercados.map(normalizarRaioSupermercado);
};

estafetaService.obterEncomendaPorId = async function (id) {
    return Order.findById(id)
        .populate('supermercadoId', 'nome localizacao localizacaoGeo custoEntrega raioAtuacao')
        .populate('clienteId', 'nome morada');
};

module.exports = estafetaService;
