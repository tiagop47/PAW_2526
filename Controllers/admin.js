const adminService = require('../services/adminService');

var adminController = {};

/**
 * Exibe a Dashboard do Administrador.
 */
adminController.exibirDashboard = async function (req, res) {
    try {
        const stats = await adminService.getDashboardStats();

        res.render('admin/dashboard', {
            title: 'Painel Admin',
            totalUsers: stats.totalUsers,
            pendentes: stats.pendentes
        });
    } catch (err) {
        res.render('admin/dashboard', {
            title: 'Painel Admin',
            totalUsers: 0,
            pendentes: 0
        });
    }
};

/**
 * Aprova um supermercado.
 */
adminController.aprovarSupermercado = async function (req, res) {
    try {
        await adminService.aprovarSupermercadoById(req.params.id);
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
        await adminService.rejeitarSupermercadoById(req.params.id);
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
 * API — Listar supermercados ativos (Limite 3).
 */
adminController.listarSupermercados = async function (req, res) {
    try {
        const limite = 3;
        const contador = parseInt(req.query.contador) || 0;
        const dados = await adminService.getMercadosAtivos(contador, limite);

        res.json({
            supermercados: dados.supermercados,
            paginaAtual: dados.paginaAtual,
            totalPaginas: dados.totalPaginas
        });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao listar supermercados.' });
    }
};

/**
 * Exibe formulário de edição de utilizador.
 */
adminController.editarUser = async function (req, res) {
    try {
        const user = await adminService.getUserByIdSemPassword(req.params.id);
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
        await adminService.atualizarUserById(req.params.id, { nome, email, telefone, morada, role });
        res.redirect('/admin/exibirUtilizadores');
    } catch (err) {
        res.status(500).send('Erro ao guardar alterações.');
    }
};

/**
 * Bloqueia um supermercado.
 */
adminController.bloquearSupermercado = async function (req, res) {
    try {
        await adminService.bloquearSupermercadoById(req.params.id);
        res.status(200).json({ success: true, message: "Supermercado Bloqueado!" });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Erro ao bloquear supermercado.' });
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