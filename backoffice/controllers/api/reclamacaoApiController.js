const Reclamacao = require('../../models/ReclamacaoModel');
const Order = require('../../models/OrderModel');
const Supermarket = require('../../models/SupermarketModel');

const reclamacaoApiController = {};

reclamacaoApiController.listarMinhas = async function (req, res) {
    try {
        const reclamacoes = await Reclamacao.find({ clienteId: req.user.id })
            .populate('supermercadoId', 'nome localizacao')
            .populate('encomendaId', 'criadoEm valorTotal estado')
            .sort({ criadoEm: -1 });

        res.json({ sucesso: true, reclamacoes });
    } catch (err) {
        res.status(500).json({ sucesso: false, erro: err.message });
    }
};

reclamacaoApiController.criar = async function (req, res) {
    try {
        const { supermercadoId, encomendaId, categoria, assunto, descricao } = req.body;
        let supermercadoFinal = supermercadoId || null;

        if (encomendaId) {
            const encomenda = await Order.findOne({ _id: encomendaId, clienteId: req.user.id });
            if (!encomenda) {
                return res.status(404).json({ sucesso: false, erro: 'Encomenda não encontrada.' });
            }
            supermercadoFinal = supermercadoFinal || encomenda.supermercadoId;
        }

        const reclamacao = await Reclamacao.create({
            clienteId: req.user.id,
            supermercadoId: supermercadoFinal || undefined,
            encomendaId: encomendaId || undefined,
            categoria,
            assunto,
            descricao
        });

        const resultado = await reclamacao.populate([
            { path: 'supermercadoId', select: 'nome localizacao' },
            { path: 'encomendaId', select: 'criadoEm valorTotal estado' }
        ]);

        res.status(201).json({ sucesso: true, reclamacao: resultado });
    } catch (err) {
        res.status(400).json({ sucesso: false, erro: err.message });
    }
};

reclamacaoApiController.listarGestao = async function (req, res) {
    try {
        const filtro = {};

        if (req.user.role === 'supermercados') {
            const supermercado = await Supermarket.findOne({ userId: req.user.id }).select('_id');
            if (!supermercado) {
                return res.json({ sucesso: true, reclamacoes: [] });
            }
            filtro.supermercadoId = supermercado._id;
        }

        const reclamacoes = await Reclamacao.find(filtro)
            .populate('clienteId', 'nome email telefone')
            .populate('supermercadoId', 'nome localizacao')
            .populate('encomendaId', 'criadoEm valorTotal estado')
            .sort({ criadoEm: -1 });

        res.json({ sucesso: true, reclamacoes });
    } catch (err) {
        res.status(500).json({ sucesso: false, erro: err.message });
    }
};

reclamacaoApiController.responder = async function (req, res) {
    try {
        const { estado, resposta } = req.body;
        const reclamacao = await Reclamacao.findById(req.params.id);

        if (!reclamacao) {
            return res.status(404).json({ sucesso: false, erro: 'Reclamação não encontrada.' });
        }

        if (req.user.role === 'supermercados') {
            const supermercado = await Supermarket.findOne({ userId: req.user.id }).select('_id');
            if (!supermercado || reclamacao.supermercadoId?.toString() !== supermercado._id.toString()) {
                return res.status(403).json({ sucesso: false, erro: 'Sem permissão para responder a esta reclamação.' });
            }
            reclamacao.respostaSupermercado = resposta;
        } else {
            reclamacao.respostaAdmin = resposta;
        }

        if (estado) {
            reclamacao.estado = estado;
        }

        await reclamacao.save();

        const resultado = await reclamacao.populate([
            { path: 'clienteId', select: 'nome email telefone' },
            { path: 'supermercadoId', select: 'nome localizacao' },
            { path: 'encomendaId', select: 'criadoEm valorTotal estado' }
        ]);

        res.json({ sucesso: true, reclamacao: resultado });
    } catch (err) {
        res.status(400).json({ sucesso: false, erro: err.message });
    }
};

module.exports = reclamacaoApiController;
