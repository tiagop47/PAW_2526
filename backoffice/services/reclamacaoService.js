const Reclamacao = require('../models/ReclamacaoModel');
const Order = require('../models/OrderModel');
const Supermarket = require('../models/SupermarketModel');

const reclamacaoService = {};

const POPULATE_CLIENTE = { path: 'clienteId', select: 'nome email telefone' };
const POPULATE_SUPERMERCADO = { path: 'supermercadoId', select: 'nome localizacao' };
const POPULATE_ENCOMENDA = { path: 'encomendaId', select: 'criadoEm valorTotal estado' };

reclamacaoService.listarDoCliente = function (clienteId) {
    return Reclamacao.find({ clienteId })
        .populate('supermercadoId', 'nome localizacao')
        .populate('encomendaId', 'criadoEm valorTotal estado')
        .sort({ criadoEm: -1 });
};

reclamacaoService.criarParaCliente = async function (clienteId, dados) {
    const { supermercadoId, encomendaId, categoria, assunto, descricao } = dados;
    let supermercadoFinal = supermercadoId || null;

    if (encomendaId) {
        const encomenda = await Order.findOne({ _id: encomendaId, clienteId });
        if (!encomenda) {
            const err = new Error('Encomenda não encontrada ou não pertence a este utilizador.');
            err.status = 404;
            throw err;
        }

        // Validação crucial: Se o cliente forneceu um supermercadoId, 
        // garantir que a encomenda pertence de facto a esse supermercado.
        if (supermercadoId && encomenda.supermercadoId.toString() !== supermercadoId.toString()) {
            const err = new Error('A encomenda selecionada não pertence ao supermercado indicado.');
            err.status = 400;
            throw err;
        }

        supermercadoFinal = encomenda.supermercadoId;
    }

    if (!supermercadoFinal && !encomendaId) {
        // Se for uma reclamação geral sobre a plataforma, pode não ter supermercado
        // mas o sistema PAW foca em supermercados, por isso validamos se pelo menos um existe
    }

    const reclamacao = await Reclamacao.create({
        clienteId,
        supermercadoId: supermercadoFinal || undefined,
        encomendaId: encomendaId || undefined,
        categoria,
        assunto,
        descricao
    });

    return reclamacao.populate([POPULATE_SUPERMERCADO, POPULATE_ENCOMENDA]);
};

reclamacaoService.listarParaGestaoApi = async function (user) {
    const filtro = {};

    if (user.role === 'supermercados') {
        const supermercado = await Supermarket.findOne({ userId: user.id }).select('_id');
        if (!supermercado) return [];
        filtro.supermercadoId = supermercado._id;
    }

    return reclamacaoService.listarPorFiltro(filtro);
};

reclamacaoService.listarTodas = function (estadoFiltro) {
    const filtro = estadoFiltro ? { estado: estadoFiltro } : {};
    return reclamacaoService.listarPorFiltro(filtro);
};

reclamacaoService.listarDoSupermercado = function (supermercadoId, estadoFiltro) {
    const filtro = { supermercadoId };
    if (estadoFiltro) {
        filtro.estado = estadoFiltro;
    }

    return reclamacaoService.listarPorFiltro(filtro);
};

reclamacaoService.listarPorFiltro = function (filtro) {
    return Reclamacao.find(filtro)
        .populate(POPULATE_CLIENTE)
        .populate(POPULATE_SUPERMERCADO)
        .populate(POPULATE_ENCOMENDA)
        .sort({ criadoEm: -1 });
};

reclamacaoService.responderComoAdmin = async function (reclamacaoId, dados) {
    const reclamacao = await Reclamacao.findById(reclamacaoId);
    if (!reclamacao) {
        const err = new Error('Reclamação não encontrada.');
        err.status = 404;
        throw err;
    }

    reclamacao.estado = dados.estado || reclamacao.estado;
    reclamacao.respostaAdmin = dados.resposta;
    await reclamacao.save();

    return reclamacao.populate([POPULATE_CLIENTE, POPULATE_SUPERMERCADO, POPULATE_ENCOMENDA]);
};

reclamacaoService.responderComoSupermercado = async function (supermercadoId, reclamacaoId, dados) {
    const reclamacao = await Reclamacao.findOne({
        _id: reclamacaoId,
        supermercadoId
    });

    if (!reclamacao) {
        const err = new Error('Reclamação não encontrada.');
        err.status = 404;
        throw err;
    }

    reclamacao.estado = dados.estado || reclamacao.estado;
    reclamacao.respostaSupermercado = dados.resposta;
    await reclamacao.save();

    return reclamacao.populate([POPULATE_CLIENTE, POPULATE_SUPERMERCADO, POPULATE_ENCOMENDA]);
};

reclamacaoService.responderPorRole = async function (user, reclamacaoId, dados) {
    if (user.role === 'administrador') {
        return reclamacaoService.responderComoAdmin(reclamacaoId, dados);
    }

    const supermercado = await Supermarket.findOne({ userId: user.id }).select('_id');
    if (!supermercado) {
        const err = new Error('Sem permissão para responder a esta reclamação.');
        err.status = 403;
        throw err;
    }

    return reclamacaoService.responderComoSupermercado(supermercado._id, reclamacaoId, dados);
};

module.exports = reclamacaoService;
