const Order = require('../models/OrderModel');
const Avaliacao = require('../models/AvaliacaoModel');

const avaliacaoService = {};

avaliacaoService.criarAvaliacao = async function (clienteId, dados) {
    const { encomendaId, notaSupermercado, notaEstafeta, comentario } = dados;

    const encomenda = await Order.findOne({ _id: encomendaId, clienteId, estado: 'entregue' });
    if (!encomenda) {
        throw new Error('Encomenda não encontrada ou ainda não entregue.');
    }

    const jaAvaliou = await Avaliacao.findOne({ encomendaId });
    if (jaAvaliou) {
        throw new Error('Esta encomenda já foi avaliada.');
    }

    const dadosAvaliacao = {
        encomendaId,
        clienteId,
        supermercadoId: encomenda.supermercadoId,
        comentario: comentario || '',
        notaSupermercado: parseInt(notaSupermercado)
    };

    if (encomenda.estafetaId && notaEstafeta) {
        dadosAvaliacao.estafetaId = encomenda.estafetaId;
        dadosAvaliacao.notaEstafeta = parseInt(notaEstafeta);
    }

    return Avaliacao.create(dadosAvaliacao);
};

avaliacaoService.getMinhasAvaliacoes = async function (clienteId) {
    return Avaliacao.find({ clienteId })
        .populate('supermercadoId', 'nome')
        .populate('estafetaId', 'nome')
        .sort({ criadoEm: -1 });
};

avaliacaoService.getAvaliacoesPorSupermercado = async function (supermercadoId) {
    const avaliacoes = await Avaliacao.find({ supermercadoId })
        .populate('clienteId', 'nome')
        .sort({ criadoEm: -1 });

    const media = avaliacoes.length > 0
        ? avaliacoes.reduce((s, a) => s + a.notaSupermercado, 0) / avaliacoes.length
        : null;

    return {
        avaliacoes,
        media: media ? parseFloat(media.toFixed(1)) : null,
        total: avaliacoes.length
    };
};

module.exports = avaliacaoService;
