const Order = require('../../models/OrderModel');
const Avaliacao = require('../../models/AvaliacaoModel');

const avaliacaoApiController = {};

avaliacaoApiController.criarAvaliacao = async function (req, res) {
    try {
        const { encomendaId, notaSupermercado, notaEstafeta, comentario } = req.body;
        const clienteId = req.user?.id;

        if (!clienteId) {
            return res.status(401).json({ sucesso: false, erro: 'Não autenticado.' });
        }

        const encomenda = await Order.findOne({ _id: encomendaId, clienteId, estado: 'entregue' });
        if (!encomenda) {
            return res.status(404).json({ sucesso: false, erro: 'Encomenda não encontrada ou ainda não entregue.' });
        }

        const jaAvaliou = await Avaliacao.findOne({ encomendaId });
        if (jaAvaliou) {
            return res.status(409).json({ sucesso: false, erro: 'Esta encomenda já foi avaliada.' });
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

        const avaliacao = await Avaliacao.create(dadosAvaliacao);
        res.status(201).json({ sucesso: true, avaliacao });
    } catch (err) {
        res.status(500).json({ sucesso: false, erro: err.message });
    }
};

avaliacaoApiController.getAvaliacoesPorSupermercado = async function (req, res) {
    try {
        const { supermercadoId } = req.params;
        const avaliacoes = await Avaliacao.find({ supermercadoId })
            .populate('clienteId', 'nome')
            .sort({ criadoEm: -1 });

        const media = avaliacoes.length > 0
            ? avaliacoes.reduce((s, a) => s + a.notaSupermercado, 0) / avaliacoes.length
            : null;

        res.json({ sucesso: true, avaliacoes, media: media ? parseFloat(media.toFixed(1)) : null, total: avaliacoes.length });
    } catch (err) {
        res.status(500).json({ sucesso: false, erro: err.message });
    }
};

module.exports = avaliacaoApiController;
