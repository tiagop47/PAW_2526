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
            stats: { totalUsers: 0, totalEstafetas: 0, pendentes: 0, ativos: 0, bloqueados: 0, totalProdutos: 0, totalEncomendas: 0, valorTotal: 0 }
        });
    }
};


/**
 * Elimina um User. 
 */
adminController.eliminarUser = async function (req, res) {
    try{
        await adminService.eliminarUser(req.params.id);
        res.redirect('/admin/exibirUtilizadores');
    } catch(err){
        res.status(500).send('Erro ao eliminar o utilizador');
    }
}



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
 * Bloquear Supermercado
 */

adminController.bloquearSupermercado = async function (req, res){
    try {
        const supermarketId = req.params.supermarketId
        
        await adminService.alternarBloqueio(supermarketId);
        res.redirect('/admin/supermercados/ativos');

    } catch (err) {
        res.status(500).send("Erro a tentar bloquear o supermercado.");
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

        const supermercadosMapa = await adminService.getTodosMercadosAtivos();
        const topSupermarkets = await adminService.getTopSupermercados();

        res.render('admin/supermercadosAtivos', {
            title: 'Gestão de Supermercados',
            supermercados: dados.supermercados,
            supermercadosMapa,
            topSupermarkets,
            paginaAtual: dados.paginaAtual,
            totalPaginas: dados.totalPaginas
        });
    } catch (err) {
        res.status(500).send('Erro ao listar supermercados.');
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

/**
 * Gestão de Categorias
 */
adminController.exibirCategorias = async function (req, res) {
    try {
        const categorias = await adminService.listarCategorias();
        res.render('admin/categorias', { title: 'Gestão de Categorias', categorias });
    } catch (err) {
        res.status(500).send('Erro ao carregar categorias.');
    }
};

adminController.criarCategoria = async function (req, res) {
    try {
        await adminService.criarCategoria(req.body);
        res.redirect('/admin/categorias');
    } catch (err) {
        res.status(500).send('Erro ao criar categoria: ' + err.message);
    }
};

adminController.eliminarCategoria = async function (req, res) {
    try {
        await adminService.eliminarCategoria(req.params.id);
        res.redirect('/admin/categorias');
    } catch (err) {
        // Redireciona com erro (ex: categoria ainda tem produtos)
        res.redirect('/admin/categorias?error=' + encodeURIComponent(err.message));
    }
};

/**
 * Monitorizar todas as encomendas do sistema.
 */
adminController.monitorizarEncomendas = async function (req, res) {
    try {
        const pagina = parseInt(req.query.pagina) || 1;
        const limite = 5;
        const dadosPagina = await adminService.getEncomendasPaginadas(pagina, limite);

        res.render('admin/encomendas', {
            title: 'Monitorização de Encomendas',
            encomendas: dadosPagina.encomendas,
            paginaAtual: pagina,
            totalPaginas: dadosPagina.totalPaginas
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao monitorizar encomendas.');
    }
};

/**
 * Exibe a fatura de uma encomenda para o administrador.
 */
adminController.exibirFatura = async function (req, res) {
    try {
        const encomenda = await adminService.getFaturaEncomenda(req.params.orderId);

        res.render('supermercado/fatura', {
            title: 'Fatura ' + encomenda.faturaNumero,
            encomenda,
            supermercado: encomenda.supermercadoId,
            layout: false
        });
    } catch (err) {
        if (err.codigo === 'NAO_ENCONTRADA') {
            return res.status(404).send(err.message);
        }
        if (err.codigo === 'SEM_FATURA') {
            return res.status(404).render('error', {
                tituloErro: 'Fatura Indisponível',
                detalheErro: err.message
            });
        }
        console.error(err);
        res.status(500).send('Erro ao carregar fatura.');
    }
};

module.exports = adminController;
