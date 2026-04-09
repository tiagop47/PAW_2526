const supermarketService = require('../services/supermarketService');

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
        encomendas: []
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
        encomendas: dashboardData.encomendas,
        top5Produtos: dashboardData.top5Produtos
    });
};

/**
 * Exibe a página de gestão de produtos.
 */
supermarketController.exibirProdutos = async function (req, res) {
    try {
        const produtos = await supermarketService.obterProdutos(req.supermercado._id);
        res.render('supermercado/produtos', {
            title: 'Gerir Produtos',
            produtos
        });
    } catch (err) {
        res.status(500).send('Erro ao carregar produtos.');
    }
};

/**
 * Exibe o formulário para criar um novo produto.
 */
supermarketController.exibirFormularioNovo = function (req, res) {
    res.render('supermercado/novoProduto', { title: 'Novo Produto' });
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
supermarketController.exibirFormularioEditar = function (req, res) {
    res.render('supermercado/editarProduto', {
        title: 'Editar Produto',
        produto: req.produto
    });
};

/**
 * Processa a criação de um novo produto (com imagem).
 */
supermarketController.criarProduto = async function (req, res) {
    try {
        const imagem = req.file ? `/images/produtos/${req.file.filename}` : '';
        await supermarketService.criarProduto(req.supermercado._id, { ...req.body, imagem });

        res.redirect('/supermercado/produtos');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao guardar produto.');
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
        res.redirect('/supermercado/produtos');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao atualizar produto.');
    }
};

/**
 * Elimina um produto.
 */
supermarketController.eliminarProduto = async function (req, res) {
    try {
        await supermarketService.eliminarProduto(req.supermercado._id, req.produto._id);
        res.redirect('/supermercado/produtos');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao eliminar produto.');
    }
};

/**
 * API — Pesquisar produtos (devolve JSON).
 */
supermarketController.pesquisarProdutos = async function (req, res) {
    try {
        const { q, categoria } = req.query;
        const produtos = await supermarketService.pesquisarProdutos(req.supermercado._id, { q, categoria });
        res.json(produtos);
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
        supermercado: req.supermercado
    });
};

/**
 * Guarda as alterações aos dados do supermercado.
 */
supermarketController.atualizarSupermercado = async function (req, res) {
    try {
        const { nome, descricao, localizacao, latitude, longitude, horarioFuncionamento, metodosEntrega, custoEntrega, raioAtuacao } = req.body;

        await supermarketService.atualizarSupermercado(req.supermercado._id, {
            nome,
            descricao,
            localizacao,
            latitude,
            longitude,
            horarioFuncionamento,
            metodosEntrega,
            custoEntrega: custoEntrega || 0,
            raioAtuacao: raioAtuacao || 5
        });

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
        const utilizador = await supermarketService.getUserByIdSemPassword(req.user.id);

        res.render('supermercado/perfil', {
            title: 'Meu Perfil',
            utilizador,
            supermercado: req.supermercado
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
        const encomendas = await supermarketService.obterEncomendas(req.supermercado._id);

        res.render('supermercado/encomendas', {
            title: 'Encomendas',
            encomendas
        });
    } catch (err) {
        res.status(500).send('Erro ao carregar encomendas.');
    }
};

/**
 * Atualiza o estado de uma encomenda.
 * A encomenda é carregada pelo middleware router.param('orderId').
 */
supermarketController.atualizarEstadoEncomenda = async function (req, res) {
    try {
        const { estado } = req.body;
        await supermarketService.atualizarEstadoEncomenda(
            req.supermercado._id,
            req.encomenda._id,
            estado
        );

        res.redirect('/supermercado/encomendas');
    } catch (err) {
        res.status(500).send('Erro ao atualizar estado.');
    }
};

/**
 * Exibe o formulário de venda em caixa.
 */
supermarketController.exibirVendaCaixa = async function (req, res) {
    try {
        const produtos = await supermarketService.obterProdutosDisponiveis(req.supermercado._id);

        res.render('supermercado/vendaCaixa', {
            title: 'Registar Venda',
            produtos,
            supermercado: req.supermercado
        });
    } catch (err) {
        res.status(500).send('Erro ao carregar formulário de venda.');
    }
};

/**
 * Processa uma venda em caixa.
 */
supermarketController.registarVenda = async function (req, res) {
    try {
        const { emailCliente, nomeCliente, telefoneCliente, moradaCliente, latitudeEntrega, longitudeEntrega, itens, metodoEntrega } = req.body;
        const listaItens = JSON.parse(itens);

        await supermarketService.registarVenda(req.supermercado._id, {
            emailCliente, nomeCliente, telefoneCliente, moradaCliente, latitudeEntrega, longitudeEntrega, listaItens, metodoEntrega
        });

        res.redirect('/supermercado/encomendas?success=Venda registada com sucesso');
    } catch (err) {
        console.error(err);
        // Em vez de enviar 400 direto, redirecionamos para o formulário ou dashboard com o erro
        res.redirect(`/supermercado/vendas/nova?error=${encodeURIComponent(err.message || 'Erro ao registar venda')}`);
    }
};

module.exports = supermarketController;
