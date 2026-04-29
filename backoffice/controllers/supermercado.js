const supermarketService = require('../services/supermarketService');
const cupaoService = require('../services/cupaoService');
const avaliacaoService = require('../services/avaliacaoService');
const authService = require('../services/authService');

var supermarketController = {};

/**
 * Exibe a Dashboard do Supermercado.
 * O supermercado é carregado pelo middleware global (req.supermercado).
 */
supermarketController.exibirDashboard = async function (req, res) {
    let dashboardData = {
        totalProdutos: 0,
        totalEncomendas: 0,
        vendasTotais: 0,
        valorMedio: 0,
        encomendasPendentes: 0,
        encomendas: [],
        mediaAvaliacao: null,
        totalAvaliacoes: 0
    };

    try {
        dashboardData = await supermarketService.obterDadosDashboard(req.supermercado._id);
    } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
    }

    res.render('supermercado/dashboard', {
        title: 'Dashboard Supermercado',
        totalProdutos: dashboardData.totalProdutos,
        totalEncomendas: dashboardData.totalEncomendas,
        vendasTotais: dashboardData.vendasTotais,
        valorMedio: dashboardData.valorMedio,
        encomendasPendentes: dashboardData.encomendasPendentes,
        encomendas: dashboardData.encomendas,
        top5Produtos: dashboardData.top5Produtos,
        mediaAvaliacao: dashboardData.mediaAvaliacao,
        totalAvaliacoes: dashboardData.totalAvaliacoes,
        stockBaixo: dashboardData.stockBaixo
    });
};

/**
 * Exibe a página de gestão de produtos.
 */
supermarketController.exibirProdutos = async function (req, res) {
    try {
        const pagina = parseInt(req.query.pagina) || 1;
        const { produtos, totalPaginas } = await supermarketService.obterProdutos(req.supermercado._id, pagina);
        const categorias = await supermarketService.listarCategorias();

        res.render('supermercado/produtos', {
            title: 'Gerir Produtos',
            produtos,
            categorias,
            paginaAtual: pagina,
            totalPaginas,
            paginaUrl: '/supermercado/produtos',
            success: req.query.success
        });
    } catch (err) {
        res.status(500).send('Erro ao carregar produtos.');
    }
};

/**
 * Exibe o formulário para criar um novo produto.
 */
supermarketController.exibirFormularioNovo = async function (req, res) {
    const categorias = await supermarketService.listarCategorias();
    const catalogo = await supermarketService.listarCatalogo();
    res.render('supermercado/novoProduto', { title: 'Novo Produto', categorias, catalogo });
};

/**
 * Exibe os detalhes de um produto.
 * O produto é carregado pelo middleware router.param('productId').
 */
supermarketController.exibirDetalhes = function (req, res) {
    res.render('supermercado/detalhesProduto', {
        title: 'Detalhes do Produto',
        produto: req.produto
    });
};

/**
 * Exibe o formulário para editar um produto.
 * O produto é carregado pelo middleware router.param('productId').
 */
supermarketController.exibirFormularioEditar = async function (req, res) {
    const categorias = await supermarketService.listarCategorias();
    res.render('supermercado/editarProduto', {
        title: 'Editar Produto',
        produto: req.produto,
        categorias
    });
};

/**
 * Processa a criação de um novo produto (com imagem).
 */
supermarketController.criarProduto = async function (req, res) {
    try {
        const imagem = req.file ? `/images/produtos/${req.file.filename}` : '';
        await supermarketService.criarProduto(req.supermercado._id, { ...req.body, imagem });

        res.redirect('/supermercado/produtos?success=1');
    } catch (err) {
        console.error(err);
        const mensagem = err.name === 'ValidationError'
            ? Object.values(err.errors).map(e => e.message).join(', ')
            : (err.message || 'Erro ao guardar produto.');

        // Redireciona de volta para o formulário com a mensagem no URL
        res.redirect(`/supermercado/produtos/novo?error=${encodeURIComponent(mensagem)}`);
    }
};

/**
 * Processa a atualização de um produto existente (com imagem).
 */
supermarketController.atualizarProduto = async function (req, res) {
    try {
        const dados = { ...req.body };
        if (req.file) {
            dados.imagem = `/images/produtos/${req.file.filename}`;
        }

        await supermarketService.atualizarProduto(req.supermercado._id, req.produto._id, dados);
        res.redirect('/supermercado/produtos?success=1');
    } catch (err) {
        console.error(err);
        const mensagem = err.name === 'ValidationError'
            ? Object.values(err.errors).map(e => e.message).join(', ')
            : (err.message || 'Erro ao atualizar produto.');

        // Redireciona de volta para a edição com a mensagem no URL
        res.redirect(`/supermercado/produtos/editar/${req.params.productId}?error=${encodeURIComponent(mensagem)}`);
    }
};


/**
 * API — Pesquisar produtos (devolve JSON).
 */
supermarketController.pesquisarProdutos = async function (req, res) {
    try {
        const { q, categoriaId, pagina, limite } = req.query;
        const resultado = await supermarketService.pesquisarProdutos(req.supermercado._id, { 
            q, 
            categoriaId, 
            pagina: parseInt(pagina) || 1, 
            limite: parseInt(limite) || 5 
        });
        res.json(resultado);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao pesquisar produtos.' });
    }
};

/**
 * Exibe o formulário de edição dos dados do supermercado.
 * Usa o req.supermercado injetado pelo middleware.
 */
supermarketController.exibirEditarSupermercado = function (req, res) {
    res.render('supermercado/editarSupermercado', {
        title: 'Editar Supermercado',
        supermercado: req.supermercado || { nome: '', localizacao: '', descricao: '', horarioFuncionamento: '', custoEntregaPorMetodo: {} },
        actionUrl: '/supermercado/editar',
        voltarUrl: '/supermercado/dashboard'
    });
};

/**
 * Guarda as alterações aos dados do supermercado.
 */
supermarketController.atualizarSupermercado = async function (req, res) {
    try {
        await supermarketService.atualizarSupermercado(req.supermercado._id, req.body);
        res.redirect('/supermercado/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao atualizar supermercado: ' + err.message);
    }
};

/**
 * Exibe o perfil do utilizador.
 */
supermarketController.exibirPerfil = async function (req, res) {
    try {
        const utilizador = await authService.getUserByIdSemPassword(req.user.id);

        res.render('supermercado/perfil', {
            title: 'Meu Perfil',
            utilizador,
            supermercado: req.supermercado || null
        });
    } catch (err) {
        res.status(500).send('Erro ao carregar perfil.');
    }
};

/**
 * Lista todas as encomendas do supermercado.
 */
supermarketController.listarEncomendas = async function (req, res) {
    try {
        const pagina = parseInt(req.query.pagina) || 1;
        const estadoFiltro = req.query.estado || null;
        const limite = 10; // Aumentei um pouco o limite por página
        
        const dados = await supermarketService.obterEncomendas(req.supermercado._id, pagina, limite, estadoFiltro);

        res.render('supermercado/encomendas', {
            title: 'Encomendas',
            encomendas: dados.encomendas,
            paginaAtual: dados.paginaAtual,
            totalPaginas: dados.totalPaginas,
            estadoFiltro, // Passamos o filtro atual para a view
            transicoesPermitidasParaEncomenda: supermarketService.transicoesPermitidasParaEncomenda,
            success: req.query.success
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao carregar encomendas.');
    }
};

supermarketController.exibirAjudaEncomendas = function (req, res) {
    res.render('supermercado/encomendas_ajuda', { title: 'Ajuda à Gestão de Encomendas' });
};

/**
 * Atualiza o estado de uma encomenda.
 * A encomenda é carregada pelo middleware router.param('orderId').
 */
supermarketController.atualizarEstadoEncomenda = async function (req, res, next) {
    try {
        const { estado } = req.body;
        await supermarketService.atualizarEstadoEncomenda(
            req.supermercado._id,
            req.encomenda._id,
            estado
        );

        res.redirect('/supermercado/encomendas?success=1');
    } catch (err) {
        err.tituloErro = 'Erro ao atualizar encomenda';
        err.detalheErro = err.message;
        next(err);
    }
};

/**
 * Exibe os detalhes de uma encomenda.
 * A encomenda é carregada pelo middleware router.param('orderId').
 */
supermarketController.exibirDetalhesEncomenda = async function (req, res) {
    try {
        const encomenda = await req.encomenda.populate([
            { path: 'produtos.produtoId' },
            { path: 'estafetaId', select: 'nome telefone email' }
        ]);

        res.render('supermercado/detalhesEncomenda', {
            title: 'Detalhes da Encomenda',
            encomenda,
            supermercado: req.supermercado,
            transicoesPermitidasParaEncomenda: supermarketService.transicoesPermitidasParaEncomenda
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao carregar detalhes da encomenda.');
    }
};

/**
 * Exibe a fatura de uma encomenda.
 */
supermarketController.exibirFatura = async function (req, res) {
    try {
        const encomenda = await req.encomenda.populate('produtos.produtoId');

        if (!encomenda.faturaNumero) {
            return res.status(404).render('error', {
                tituloErro: 'Fatura Indisponível',
                detalheErro: 'Esta encomenda ainda não tem uma fatura gerada. A fatura é criada automaticamente quando a encomenda é confirmada ou entregue.'
            });
        }

        res.render('supermercado/fatura', {
            title: 'Fatura ' + encomenda.faturaNumero,
            encomenda,
            supermercado: req.supermercado,
            layout: false
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao carregar fatura.');
    }
};

supermarketController.verificarStock = async function (req, res) {
    try {
        const { itens } = req.body;
        const resultado = await supermarketService.verificarStock(req.supermercado._id, itens);
        res.json(resultado);
    } catch (err) {
        console.error('Erro ao verificar stock:', err);
        res.status(500).json({ sucesso: false, erro: 'Erro interno ao verificar stock.' });
    }
};

/**
 * Exibe o formulário de venda em caixa.
 */
supermarketController.exibirVendaCaixa = async function (req, res) {
    try {
        const produtos = [];

        const categorias = await supermarketService.listarCategorias();

        res.render('supermercado/vendaCaixa', {
            title: 'Registar Venda',
            produtos,
            categorias,
            supermercado: req.supermercado
        });
    } catch (err) {
        res.status(500).send('Erro ao carregar formulário de venda.');
    }
};

supermarketController.registarVenda = async function (req, res) {
    try {
        const { emailCliente, nomeCliente, nifCliente, telefoneCliente, moradaCliente, latitudeEntrega, longitudeEntrega, itens, metodoEntrega } = req.body;

        let listaItens;

        try {
            listaItens = JSON.parse(itens || '[]');
        } catch (e) {
            return res.status(400).render('error', {
                message: 'Dados inválidos',
                tituloErro: 'Erro no Registo de Venda',
                detalheErro: 'O formato dos itens enviados é inválido.',
                error: { status: 400 }
            });
        }

        if (!Array.isArray(listaItens) || listaItens.length === 0) {
            return res.status(400).render('error', {
                message: 'Carrinho vazio',
                tituloErro: 'Erro no Registo de Venda',
                detalheErro: 'Adicione pelo menos um produto ao carrinho.',
                error: { status: 400 }
            });
        }

        for (const item of listaItens) {
            if (!item.produtoId || !Number.isInteger(item.quantidade) || item.quantidade < 1) {
                return res.status(400).render('error', {
                    message: 'Item inválido',
                    tituloErro: 'Erro no Registo de Venda',
                    detalheErro: 'Cada item deve ter um produtoId válido e uma quantidade inteira positiva.',
                    error: { status: 400 }
                });
            }
        }

        await supermarketService.registarVenda(req.supermercado._id, {
            emailCliente, nomeCliente, nifCliente, telefoneCliente, moradaCliente, latitudeEntrega, longitudeEntrega, listaItens, metodoEntrega
        });

        res.redirect('/supermercado/encomendas?success=Venda em caixa registada');
    } catch (err) {
        console.error('ERRO NO REGISTAR VENDA:', err);
        res.status(400);
        return res.render('error', {
            message: err.message,
            tituloErro: 'Erro no Registo de Venda',
            detalheErro: err.message,
            error: { status: 400 }
        });
    }
};

/**
 * Exibe a página de gestão de cupões do supermercado.
 */
supermarketController.exibirCupoes = async function (req, res) {
    try {
        const cupoes = await cupaoService.listarCupoes(req.supermercado._id);
        res.render('supermercado/cupoes', {
            title: 'Gestão de Cupões',
            cupoes,
            supermercado: req.supermercado
        });
    } catch (err) {
        res.status(500).send('Erro ao carregar cupões.');
    }
};

/**
 * Cria um novo cupão para o supermercado.
 */
supermarketController.criarCupao = async function (req, res) {
    try {
        await cupaoService.criarCupao(req.supermercado._id, req.body);
        res.redirect('/supermercado/cupoes?success=Cupão criado com sucesso');
    } catch (err) {
        const msg = err.code === 11000
            ? 'Já existe um cupão com esse código neste supermercado.'
            : (err.message || 'Erro ao criar cupão.');
        res.redirect('/supermercado/cupoes?error=' + encodeURIComponent(msg));
    }
};

/**
 * Desativa um cupão do supermercado.
 */
supermarketController.desativarCupao = async function (req, res) {
    try {
        await cupaoService.desativarCupao(req.supermercado._id, req.params.cupaoId);
        res.redirect('/supermercado/cupoes');
    } catch (err) {
        res.redirect('/supermercado/cupoes?error=' + encodeURIComponent('Erro ao desativar cupão.'));
    }
};

/**
 * Ativa um cupão do supermercado.
 */
supermarketController.ativarCupao = async function (req, res) {
    try {
        await cupaoService.ativarCupao(req.supermercado._id, req.params.cupaoId);
        res.redirect('/supermercado/cupoes');
    } catch (err) {
        res.redirect('/supermercado/cupoes?error=' + encodeURIComponent('Erro ao ativar cupão.'));
    }
};

/**
 * Elimina um cupão do supermercado.
 */
supermarketController.eliminarCupao = async function (req, res) {
    try {
        await cupaoService.eliminarCupao(req.supermercado._id, req.params.cupaoId);
        res.redirect('/supermercado/cupoes');
    } catch (err) {
        res.redirect('/supermercado/cupoes?error=' + encodeURIComponent('Erro ao eliminar cupão.'));
    }
};

supermarketController.exibirAvaliacoes = async function (req, res) {
    try {
        const dados = await avaliacaoService.getAvaliacoesPorSupermercado(req.supermercado._id);
        res.render('supermercado/avaliacoes', {
            title: 'Avaliações',
            avaliacoes: dados.avaliacoes,
            media: dados.media || 0,
            total: dados.total,
            supermercado: req.supermercado
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao carregar avaliações.');
    }
};

module.exports = supermarketController;
