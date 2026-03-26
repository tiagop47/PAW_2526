const estafetaService = require('../services/estafetaServices');

const estafetaController = {};

estafetaController.exibirDashboard = async function (req, res) {
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

estafetaController.listarEntregasDisponiveis = async function (req, res) {
    try {
        const { lat, lng } = req.query;
        let entregas;
        let supermercadosCobertura = [];

        if (lat && lng) {
            const [entregasFiltradas, mercadosCobertura] = await Promise.all([
                estafetaService.obterEntregasPorLocalizacao(lat, lng),
                estafetaService.obterSupermercadosCoberturaPorLocalizacao(lat, lng)
            ]);

            entregas = entregasFiltradas;
            supermercadosCobertura = mercadosCobertura;
        } else {
            entregas = await estafetaService.obterEntregasDisponiveis();
        }

        res.render('estafeta/entregas', { entregas, lat, lng, supermercadosCobertura });
    } catch (error) {
        console.error('Erro ao listar entregas:', error);
        res.render('estafeta/entregas', { entregas: [], erro: 'Erro ao carregar entregas' });
    }
};

estafetaController.listarMinhasEntregas = async function (req, res) {
    try {
        const estafetaId = req.user.id;
        const entregas = await estafetaService.obterMinhasEntregas(estafetaId);
        res.render('estafeta/minhasEntregas', { entregas });
    } catch (error) {
        console.error('Erro ao listar minhas entregas:', error);
        res.render('estafeta/minhasEntregas', { entregas: [], erro: 'Erro ao carregar entregas' });
    }
};

estafetaController.aceitarEntrega = async function (req, res) {
    try {
        const estafetaId = req.user.id;
        const encomenda = req.encomenda; // Carregada pelo router.param
        
        if (encomenda.estafetaId) {
            throw new Error('Esta entrega já foi aceite por outro estafeta');
        }

        if (encomenda.estado !== 'confirmada') {
            throw new Error('Esta encomenda não está disponível para entrega');
        }

        encomenda.estafetaId = estafetaId;
        encomenda.estado = 'em entrega';
        await encomenda.save();

        res.json({ sucesso: true, mensagem: 'Entrega aceite com sucesso' });
    } catch (error) {
        console.error('Erro ao aceitar entrega:', error);
        res.status(400).json({ sucesso: false, erro: error.message });
    }
};

estafetaController.confirmarEntrega = async function (req, res) {
    try {
        const estafetaId = req.user.id;
        const encomenda = req.encomenda; // Carregada pelo router.param

        if (!encomenda.estafetaId || encomenda.estafetaId.toString() !== estafetaId.toString()) {
            throw new Error('Esta entrega não pertence a este estafeta');
        }

        if (encomenda.estado !== 'em entrega') {
            throw new Error('Esta encomenda não está em entrega');
        }

        encomenda.estado = 'entregue';
        await encomenda.save();

        res.json({ sucesso: true, mensagem: 'Entrega confirmada com sucesso' });
    } catch (error) {
        console.error('Erro ao confirmar entrega:', error);
        res.status(400).json({ sucesso: false, erro: error.message });
    }
};

estafetaController.obterEntregasAPI = async function (req, res) {
    try {
        const { lat, lng } = req.query;
        let entregas;
        let supermercadosCobertura = [];

        if (lat && lng) {
            const [entregasFiltradas, mercadosCobertura] = await Promise.all([
                estafetaService.obterEntregasPorLocalizacao(lat, lng),
                estafetaService.obterSupermercadosCoberturaPorLocalizacao(lat, lng)
            ]);

            entregas = entregasFiltradas;
            supermercadosCobertura = mercadosCobertura;
        } else {
            entregas = await estafetaService.obterEntregasDisponiveis();
        }

        res.json({ sucesso: true, entregas, supermercadosCobertura });
    } catch (error) {
        console.error('Erro ao obter entregas:', error);
        res.status(500).json({ sucesso: false, erro: 'Erro ao carregar entregas' });
    }
};

estafetaController.obterSupermercadosCoberturaAPI = async function (req, res) {
    try {
        const { lat, lng } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({ sucesso: false, erro: 'Parâmetros lat e lng são obrigatórios' });
        }

        const supermercados = await estafetaService.obterSupermercadosCoberturaPorLocalizacao(lat, lng);
        res.json({ sucesso: true, supermercados });
    } catch (error) {
        console.error('Erro ao obter cobertura de supermercados:', error);
        res.status(500).json({ sucesso: false, erro: error.message || 'Erro ao carregar cobertura' });
    }
};

estafetaController.obterSupermercadosAPI = async function (req, res) {
    try {
        const supermercados = await estafetaService.obterSupermercadosAtivos();
        res.json({ sucesso: true, supermercados });
    } catch (error) {
        console.error('Erro ao obter supermercados:', error);
        res.status(500).json({ sucesso: false, erro: 'Erro ao carregar supermercados' });
    }
};

module.exports = estafetaController;
