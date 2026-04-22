const estafetaService = require('../services/estafetaServices');

const estafetaController = {};

estafetaController.exibirDashboard = async function (req, res) {
    try {
        const estafetaId = req.user.id;
        const dados = await estafetaService.obterDadosDashboard(estafetaId);

        res.render('estafeta/dashboard', {
            title: 'Painel do Estafeta',
            stats: dados.stats,
            estafetaId: estafetaId,
            zonasTrabalho: dados.zonasTrabalho
        });
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        res.render('estafeta/dashboard', {
            title: 'Painel do Estafeta',
            estafetaId: req.user ? req.user.id : '',
            zonasTrabalho: [],
            stats: {
                entregasRealizadas: 0,
                entregasEmCurso: 0,
                ganhosTotais: 0,
                zonaMaisPopular: null,
                totalZonaPopular: 0
            }
        });
    }
};

estafetaController.listarEntregasDisponiveis = async function (req, res) {
    try {
        const entregas = await estafetaService.obterEntregasDisponiveis();
        res.render('estafeta/entregas', { entregas, estafetaId: req.user.id });
    } catch (error) {
        res.render('estafeta/entregas', { entregas: [], erro: 'Erro ao carregar entregas' });
    }
};

estafetaController.listarMinhasEntregas = async function (req, res) {
    try {
        const entregas = await estafetaService.obterMinhasEntregas(req.user.id);
        res.render('estafeta/minhasEntregas', { entregas });
    } catch (error) {
        res.render('estafeta/minhasEntregas', { entregas: [], erro: 'Erro ao carregar entregas' });
    }
};

estafetaController.aceitarEntrega = async function (req, res) {
    try {
        await estafetaService.aceitarEntrega(req.encomenda._id, req.user.id);
        res.json({ sucesso: true, mensagem: 'Entrega aceite com sucesso' });
    } catch (error) {
        res.status(400).json({ sucesso: false, erro: error.message });
    }
};

estafetaController.confirmarEntrega = async function (req, res) {
    try {
        await estafetaService.confirmarEntrega(req.encomenda._id, req.user.id);
        res.json({ sucesso: true, mensagem: 'Entrega confirmada com sucesso' });
    } catch (error) {
        res.status(400).json({ sucesso: false, erro: error.message });
    }
};

estafetaController.obterEntregasAPI = async function (req, res) {
    try {
        const entregas = await estafetaService.obterEntregasDisponiveis();
        res.json({ sucesso: true, entregas });
    } catch (error) {
        console.error('Erro na API de entregas:', error);
        res.status(500).json({ sucesso: false, erro: 'Erro ao carregar entregas' });
    }
};

/**
 * Exibe a página de perfil do estafeta.
 */
estafetaController.exibirPerfil = async function (req, res) {
    try {
        const utilizador = await estafetaService.getUserByIdSemPassword(req.user.id);
        res.render('estafeta/perfil', {
            title: 'Meu Perfil',
            utilizador,
            success: req.query.success,
            error: req.query.error
        });
    } catch (err) {
        res.status(500).send('Erro ao carregar perfil.');
    }
};

/**
 * Processa a atualização do perfil do estafeta.
 */
estafetaController.atualizarPerfil = async function (req, res) {
    try {
        await estafetaService.atualizarPerfil(req.user.id, req.body);
        res.redirect('/estafeta/perfil?success=Perfil atualizado com sucesso');
    } catch (err) {
        res.redirect(`/estafeta/perfil?error=${encodeURIComponent(err.message)}`);
    }
};

module.exports = estafetaController;
