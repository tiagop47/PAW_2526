const avaliacaoService = require('../../services/avaliacaoService');

const avaliacaoApiController = {};

avaliacaoApiController.criarAvaliacao = async function (req, res) {
    try {
        const avaliacao = await avaliacaoService.criarAvaliacao(req.user.id, req.body);
        res.status(201).json({ sucesso: true, avaliacao });
    } catch (err) {
        const status = err.message.includes('já foi avaliada') ? 409
            : err.message.includes('não encontrada') ? 404
                : 500;
        res.status(status).json({ sucesso: false, erro: err.message });
    }
};

avaliacaoApiController.getAvaliacoesPorSupermercado = async function (req, res) {
    try {
        const resultado = await avaliacaoService.getAvaliacoesPorSupermercado(req.params.supermercadoId);
        res.json({ sucesso: true, avaliacoes: resultado.avaliacoes, media: resultado.media, total: resultado.total });
    } catch (err) {
        res.status(500).json({ sucesso: false, erro: err.message });
    }
};

module.exports = avaliacaoApiController;
