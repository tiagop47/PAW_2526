const estafetaService = require('../services/estafetaServices');

const estafetaController = {};

estafetaController.exibirDashboard = async function (req, res) {
    try {
        const estafetaId = req.user.id;
        const [stats, supermercados, entregas] = await Promise.all([
            estafetaService.obterEstatisticas(estafetaId),
            estafetaService.obterSupermercadosAtivos(),
            estafetaService.obterEntregasDisponiveis()
        ]);

        const zonasObjeto = {};
        supermercados.forEach(s => {
            const zona = (s.localizacao || '').trim();
            if (zona) zonasObjeto[zona.toLowerCase()] = zona;
        });

        const zonasTrabalho = Object.keys(zonasObjeto)
            .sort((a, b) => zonasObjeto[a].localeCompare(zonasObjeto[b], 'pt'))
            .map(key => ({ value: key, label: zonasObjeto[key] }));

        const contagem = {};
        let zonaMaisEncomendas = null;
        let maxEncomendas = 0;

        entregas.forEach(e => {
            const zona = e.supermercadoId && e.supermercadoId.localizacao;
            if (zona) {
                contagem[zona] = (contagem[zona] || 0) + 1;
                if (contagem[zona] > maxEncomendas) {
                    maxEncomendas = contagem[zona];
                    zonaMaisEncomendas = zona;
                }
            }
        });

        res.render('estafeta/dashboard', {
            title: 'Painel do Estafeta',
            stats: {
                entregasRealizadas: stats.entregasRealizadas,
                entregasEmCurso: stats.entregasEmCurso,
                entregasDisponiveis: stats.entregasDisponiveis,
                ganhosTotais: stats.ganhosTotais,
                zonaMaisEncomendas: zonaMaisEncomendas,
                maxEncomendas: maxEncomendas
            },
            estafetaId,
            zonasTrabalho
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
                entregasDisponiveis: 0,
                ganhosTotais: 0,
                zonaMaisEncomendas: null,
                maxEncomendas: 0
            }
        });
    }
};

estafetaController.listarEntregasDisponiveis = async function (req, res) {
    try {
        const [entregas, supermercados] = await Promise.all([
            estafetaService.obterEntregasDisponiveis(),
            estafetaService.obterSupermercadosAtivos()
        ]);
        res.render('estafeta/entregas', { entregas, supermercadosCobertura: supermercados, estafetaId: req.user.id, lat: null, lng: null });
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
        const { lat, lng } = req.query;
        const [entregas, supermercadosCobertura] = (lat && lng) 
            ? await Promise.all([estafetaService.obterEntregasPorLocalizacao(lat, lng), estafetaService.obterSupermercadosCoberturaPorLocalizacao(lat, lng)])
            : [await estafetaService.obterEntregasDisponiveis(), []];
        res.json({ sucesso: true, entregas, supermercadosCobertura });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: 'Erro ao carregar entregas' });
    }
};

estafetaController.obterSupermercadosCoberturaAPI = async function (req, res) {
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng) return res.status(400).json({ sucesso: false, erro: 'Parâmetros lat e lng são obrigatórios' });
        const supermercados = await estafetaService.obterSupermercadosCoberturaPorLocalizacao(lat, lng);
        res.json({ sucesso: true, supermercados });
    } catch (error) {
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
