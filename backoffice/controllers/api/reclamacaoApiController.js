const reclamacaoService = require('../../services/reclamacaoService');

const reclamacaoApiController = {};

reclamacaoApiController.listarMinhas = async function (req, res) {
    try {
        const reclamacoes = await reclamacaoService.listarDoCliente(req.user.id);
        res.json({ sucesso: true, reclamacoes });
    } catch (err) {
        res.status(500).json({ sucesso: false, erro: err.message });
    }
};

reclamacaoApiController.criar = async function (req, res) {
    try {
        const resultado = await reclamacaoService.criarParaCliente(req.user.id, req.body);

        res.status(201).json({ sucesso: true, reclamacao: resultado });
    } catch (err) {
        res.status(err.status || 400).json({ sucesso: false, erro: err.message });
    }
};

reclamacaoApiController.listarGestao = async function (req, res) {
    try {
        const reclamacoes = await reclamacaoService.listarParaGestaoApi(req.user);
        res.json({ sucesso: true, reclamacoes });
    } catch (err) {
        res.status(500).json({ sucesso: false, erro: err.message });
    }
};

reclamacaoApiController.responder = async function (req, res) {
    try {
        const resultado = await reclamacaoService.responderPorRole(req.user, req.params.id, req.body);

        res.json({ sucesso: true, reclamacao: resultado });
    } catch (err) {
        res.status(err.status || 400).json({ sucesso: false, erro: err.message });
    }
};

module.exports = reclamacaoApiController;
