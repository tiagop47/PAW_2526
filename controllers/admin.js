const adminService = require('../services/adminService');

var adminController = {};

/**
 * Exibe a Dashboard do Administrador.
 */
adminController.exibirDashboard = async function (req, res) {
    try {
        const stats = await adminService.getDashboardStats();
        res.render('admin/dashboard', { title: 'Painel Admin', stats });
    } catch (err) {
        res.render('admin/dashboard', {
            title: 'Painel Admin',
            stats: { totalUsers: 0, totalEstafetas: 0, pendentes: 0, ativos: 0, totalProdutos: 0, totalEncomendas: 0 }
        });
    }
};

/**
 * Aprova um supermercado.
 */
adminController.aprovarSupermercado = async function (req, res) {
    try {
        await adminService.aprovarSupermercadoById(req.params.supermarketId);
        res.redirect('/admin/supermercados/pendentes');
    } catch (err) {
        res.status(500).send('Erro ao aprovar supermercado.');
    }
};

/**
 * Rejeita um supermercado.
 */
adminController.rejeitarSupermercado = async function (req, res) {
    try {
        await adminService.rejeitarSupermercadoById(req.params.supermarketId);
        res.redirect('/admin/supermercados/pendentes');
    } catch (err) {
        res.status(500).send('Erro ao rejeitar supermercado.');
    }
};

/**
 * Lista todos os utilizadores (Limite 3).
 */
adminController.listarUtilizadores = async function (req, res) {
    try {
        const pagina = parseInt(req.query.pagina) || 1;
        const limite = 3;
        const dadosPagina = await adminService.getUsersDocumentos(pagina, limite);

        res.render('admin/exibirUtilizadores', {
            title: 'Gestão de Utilizadores',
            users: dadosPagina.users,
            paginaAtual: pagina,
            totalPaginas: dadosPagina.totalPaginas
        });
    } catch (err) {
        res.status(500).send('Erro ao carregar lista de utilizadores.');
    }
};

/**
 * Lista os supermercados que aguardam aprovação (Limite 3).
 */
adminController.listarPendentes = async function (req, res) {
    try {
        const pagina = parseInt(req.query.pagina) || 1;
        const limite = 3;
        const dadosPagina = await adminService.getPendentesDocumentos(pagina, limite);

        res.render('admin/supermercadosPendentes', {
            title: 'Aprovações Pendentes',
            supermercados: dadosPagina.supermercados,
            paginaAtual: pagina,
            totalPaginas: dadosPagina.totalPaginas
        });
    } catch (err) {
        res.status(500).send('Erro ao carregar lista de pendentes.');
    }
};

/**
 * Lista supermercados ativos (Limite 3).
 */
adminController.listarSupermercados = async function (req, res) {
    try {
        const limite = 3;
        const pagina = parseInt(req.query.pagina) || 1;
        const contador = (pagina - 1) * limite;
        const dados = await adminService.getMercadosAtivos(contador, limite);
        const pretendeJson = req.query.formato === 'json'
            || req.xhr
            || (req.get('accept') || '').includes('application/json');

        if (pretendeJson) {
            return res.json({
                supermercados: dados.supermercados,
                paginaAtual: dados.paginaAtual,
                totalPaginas: dados.totalPaginas
            });
        }

        const supermercadosMapa = await adminService.getTodosMercadosAtivos();

        res.render('admin/supermercadosAtivos', {
            title: 'Gestão de Supermercados',
            supermercados: dados.supermercados,
            supermercadosMapa,
            paginaAtual: dados.paginaAtual,
            totalPaginas: dados.totalPaginas
        });
    } catch (err) {
        res.status(500).send('Erro ao listar supermercados.');
    }
};

/**
 * Exibe formulário de edição de utilizador.
 */
adminController.editarUser = async function (req, res) {
    try {
        const user = await adminService.getUserByIdSemPassword(req.params.userId);
        if (!user) return res.status(404).send('Utilizador não encontrado.');
        res.render('admin/editarUtilizador', { title: 'Editar Utilizador', user });
    } catch (err) {
        res.status(500).send('Erro ao carregar utilizador.');
    }
};

/**
 * Guarda alterações de utilizador.
 */
adminController.guardarUser = async function (req, res) {
    try {
        const { nome, email, telefone, morada, role } = req.body;
        await adminService.atualizarUserById(req.params.userId, { nome, email, telefone, morada, role });
        res.redirect('/admin/exibirUtilizadores');
    } catch (err) {
        res.status(500).send('Erro ao guardar alterações.');
    }
};

/**
 * Lista estafetas para gestão admin (Limite 3).
 */
adminController.listarEstafetas = async function (req, res) {
    try {
        const pagina = parseInt(req.query.pagina) || 1;
        const limite = 3;
        const dadosPagina = await adminService.getEstafetasDocumentos(pagina, limite);

        res.render('admin/exibirUtilizadores', {
            title: 'Gestão de Estafetas',
            users: dadosPagina.users,
            paginaAtual: pagina,
            totalPaginas: dadosPagina.totalPaginas
        });
    } catch (err) {
        res.status(500).send('Erro ao carregar lista de estafetas.');
    }
};

module.exports = adminController;
