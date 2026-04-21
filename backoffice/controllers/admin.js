const adminService = require('../services/adminService');

var adminController = {};

/**
 * Exibe a Dashboard do Administrador.
 */
adminController.exibirDashboard = async function (req, res) {
    try {
        const [stats, registosMensais, faturacaoZona] = await Promise.all([
            adminService.getDashboardStats(),
            adminService.getRegistosMensais(),
            adminService.getFaturacaoPorZona()
        ]);
        res.render('admin/dashboard', { title: 'Painel Admin', stats, registosMensais, faturacaoZona });
    } catch (err) {
        res.render('admin/dashboard', {
            title: 'Painel Admin',
            stats: {
                totalUsers: 0,
                totalEstafetas: 0,
                pendentes: 0,
                ativos: 0,
                bloqueados: 0,
                totalProdutos: 0,
                totalEncomendas: 0,
                valorTotal: 0
            },
            registosMensais: [],
            faturacaoZona: []
        });
    }
};


/**
 * Exibe formulário de edição de utilizador.
 */
adminController.exibirEditarUser = function (req, res) {
    if (req.targetUser.role === 'administrador') {
        return res.status(403).send('Não é permitido editar o administrador.');
    }

    res.render('admin/editarUtilizador', {
        title: 'Editar Utilizador',
        targetUser: req.targetUser,
        errorMessage: null
    });
};

/**
 * Processa edição de utilizador.
 */
adminController.editarUser = async function (req, res) {
    try {
        const { nome, email, telefone, nif, morada, role } = req.body;
        const roleFinal = role === 'administrador' ? req.targetUser.role : role;
        await adminService.atualizarUserById(req.targetUser._id, { nome, email, telefone, nif, morada, role: roleFinal });
        res.redirect('/admin/exibirUtilizadores');
    } catch (err) {
        res.render('admin/editarUtilizador', {
            title: 'Editar Utilizador',
            targetUser: req.targetUser,
            errorMessage: err.message
        });
    }
};

/**
 * Elimina um User.
 */
adminController.eliminarUser = async function (req, res) {
    try {
        if (req.targetUser.role === 'administrador') {
            return res.status(403).send('Não é permitido eliminar o administrador.');
        }
        await adminService.eliminarUser(req.targetUser._id);
        res.redirect('/admin/exibirUtilizadores');
    } catch (err) {
        res.status(500).send('Erro ao eliminar o utilizador');
    }
}

/**
 * Aprova um supermercado.
 */
adminController.aprovarSupermercado = async function (req, res) {
    try {
        await adminService.aprovarSupermercadoById(req.targetSupermercado._id);
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
        await adminService.rejeitarSupermercadoById(req.targetSupermercado._id);
        res.redirect('/admin/supermercados/pendentes');
    } catch (err) {
        res.status(500).send('Erro ao rejeitar supermercado.');
    }
};

/**
 * Bloquear Supermercado
 */

adminController.bloquearSupermercado = async function (req, res) {
    try {
        await adminService.alternarBloqueio(req.targetSupermercado._id);
        res.redirect('/admin/supermercados/ativos');

    } catch (err) {
        res.status(500).send("Erro a tentar bloquear o supermercado.");
    }
};

/**
 * Exibe formulário para transferir propriedade de um supermercado.
 */
adminController.exibirTransferirPropriedade = async function (req, res) {
    try {
        const candidatos = await adminService.getUtilizadoresCandidatos();
        res.render('admin/transferirSupermercado', {
            title: 'Transferir Proprietário',
            supermercado: req.targetSupermercado,
            candidatos
        });
    } catch (err) {
        res.status(500).send('Erro ao carregar candidatos.');
    }
};

/**
 * Processa a transferência de propriedade.
 */
adminController.transferirPropriedade = async function (req, res) {
    try {
        const { novoUserId } = req.body;
        await adminService.transferirPropriedade(req.targetSupermercado._id, novoUserId);
        res.redirect('/admin/supermercados/ativos');
    } catch (err) {
        res.status(500).send('Erro ao transferir: ' + err.message);
    }
};

/**
 * Exibe o formulário de edição de um supermercado para o Admin.
 */
adminController.exibirEditarSupermercado = function (req, res) {
    res.render('supermercado/editarSupermercado', {
        title: 'Editar Supermercado: ' + req.targetSupermercado.nome,
        supermercado: req.targetSupermercado,
        actionUrl: '/admin/supermercados/editar/' + req.targetSupermercado._id,
        voltarUrl: '/admin/supermercados/ativos'
    });
};


/**
 * Processa a atualização de um supermercado pelo Admin.
 */
adminController.editarSupermercado = async function (req, res) {
    try {
        const supermarketService = require('../services/supermarketService');
        await supermarketService.atualizarSupermercado(req.targetSupermercado._id, req.body);
        res.redirect('/admin/supermercados/ativos');
    } catch (err) {
        res.status(500).send('Erro ao atualizar: ' + err.message);
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
        const dados = await adminService.getMercadosAtivos(pagina, limite);

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
        await adminService.eliminarCategoria(req.targetCategoria._id);
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
    const encomenda = req.targetEncomenda;

    if (!encomenda.faturaNumero) {
        return res.status(404).render('error', {
            tituloErro: 'Fatura Indisponível',
            detalheErro: 'Esta encomenda ainda não tem uma fatura gerada.'
        });
    }

    res.render('supermercado/fatura', {
        title: 'Fatura ' + encomenda.faturaNumero,
        encomenda,
        supermercado: encomenda.supermercadoId,
        layout: false
    });
};


/**
 * Gestão de cupões de desconto
 */

adminController.exibirCupoes = async function (req, res) {
    try {
        const cupoes = await adminService.listarCupoes();
        res.render('admin/cupom', {
            title: 'Gestão de Cupões',
            cupoes
        });
    } catch (err) {
        res.status(500).send('Erro ao carregar sistema de cupões: ' + err.message);
    }
};

adminController.criarCupao = async function (req, res) {
    try {
        await adminService.criarCupao(req.body);
        res.redirect('/admin/cupoes');
    } catch (err) {
        res.redirect('/admin/cupoes?error=' + encodeURIComponent('Erro ao criar: Podem faltar campos ou código estar duplicado.'));
    }
};

adminController.desativarCupao = async function (req, res) {
    try {
        await adminService.desativarCupao(req.params.cupaoId);
        res.redirect('/admin/cupoes');
    } catch (err) {
        res.redirect('/admin/cupoes?error=' + encodeURIComponent('Erro ao desativar cupão.'));
    }
};

adminController.ativarCupao = async function (req, res) {
    try {
        await adminService.ativarCupao(req.params.cupaoId);
        res.redirect('/admin/cupoes');
    } catch (err) {
        res.redirect('/admin/cupoes?error=' + encodeURIComponent('Erro ao ativar cupão.'));
    }
};

adminController.eliminarCupao = async function (req, res) {
    try {
        await adminService.eliminarCupao(req.params.cupaoId);
        res.redirect('/admin/cupoes');
    } catch (err) {
        res.redirect('/admin/cupoes?error=' + encodeURIComponent('Erro ao eliminar cupão.'));
    }
};

module.exports = adminController;
