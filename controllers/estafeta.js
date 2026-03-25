const estafetaService = require('../services/estafetaServices');

const estafetaController = {};

estafetaController.exibirDashboard = async function(req, res) {
    try {
        const estafetaId = req.user.id;
        const stats = await estafetaService.obterEstatisticas(estafetaId);
        res.render('estafeta/dashboard', { title: 'Painel do Estafeta', stats });
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        res.render('estafeta/dashboard', {
            title: 'Painel do Estafeta',
            stats: {
                entregasRealizadas: 0,
                entregasEmCurso: 0,
                entregasDisponiveis: 0,
                ganhosTotais: 0
            }
        });
    }
};

estafetaController.listarEntregasDisponiveis = async function(req, res) {
    try {
        const { lat, lng } = req.query;
        let entregas;

        if (lat && lng) {
            entregas = await estafetaService.obterEntregasPorLocalizacao(lat, lng);
        } else {
            entregas = await estafetaService.obterEntregasDisponiveis();
        }

        res.render('estafeta/entregas', { entregas, lat, lng });
    } catch (error) {
        console.error('Erro ao listar entregas:', error);
        res.render('estafeta/entregas', { entregas: [], erro: 'Erro ao carregar entregas' });
    }
};

estafetaController.listarMinhasEntregas = async function(req, res) {
    try {
        const estafetaId = req.user.id;
        const entregas = await estafetaService.obterMinhasEntregas(estafetaId);
        res.render('estafeta/minhasEntregas', { entregas });
    } catch (error) {
        console.error('Erro ao listar minhas entregas:', error);
        res.render('estafeta/minhasEntregas', { entregas: [], erro: 'Erro ao carregar entregas' });
    }
};

estafetaController.aceitarEntrega = async function(req, res) {
    try {
        const estafetaId = req.user.id;
        const encomendaId = req.params.id;
        await estafetaService.aceitarEntrega(encomendaId, estafetaId);
        res.json({ sucesso: true, mensagem: 'Entrega aceite com sucesso' });
    } catch (error) {
        console.error('Erro ao aceitar entrega:', error);
        res.status(400).json({ sucesso: false, erro: error.message });
    }
};

estafetaController.confirmarEntrega = async function(req, res) {
    try {
        const estafetaId = req.user.id;
        const encomendaId = req.params.id;
        await estafetaService.confirmarEntrega(encomendaId, estafetaId);
        res.json({ sucesso: true, mensagem: 'Entrega confirmada com sucesso' });
    } catch (error) {
        console.error('Erro ao confirmar entrega:', error);
        res.status(400).json({ sucesso: false, erro: error.message });
    }
};

estafetaController.obterEntregasAPI = async function(req, res) {
    try {
        const { lat, lng } = req.query;
        let entregas;

        if (lat && lng) {
            entregas = await estafetaService.obterEntregasPorLocalizacao(lat, lng);
        } else {
            entregas = await estafetaService.obterEntregasDisponiveis();
        }

        res.json({ sucesso: true, entregas });
    } catch (error) {
        console.error('Erro ao obter entregas:', error);
        res.status(500).json({ sucesso: false, erro: 'Erro ao carregar entregas' });
    }
};

estafetaController.obterSupermercadosAPI = async function(req, res) {
    try {
        const supermercados = await estafetaService.obterSupermercadosAtivos();
        res.json({ sucesso: true, supermercados });
    } catch (error) {
        console.error('Erro ao obter supermercados:', error);
        res.status(500).json({ sucesso: false, erro: 'Erro ao carregar supermercados' });
    }
};

module.exports = estafetaController;
