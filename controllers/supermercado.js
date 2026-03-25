const supermarketService = require('../services/supermarketService');

var supermarketController = {};

/**
 * Exibe a Dashboard do Supermercado.
 */
supermarketController.exibirDashboard = async function (req, res) {
    let dashboardData = {
        totalProdutos: 0,
        totalEncomendas: 0,
        vendasTotais: 0,
        encomendas: []
    };

    try {
        dashboardData = await supermarketService.getDashboardData(req.user.id);
    } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
    }

    res.render('supermercado/dashboard', {
        title: 'Dashboard Supermercado',
        totalProdutos: dashboardData.totalProdutos,
        totalEncomendas: dashboardData.totalEncomendas,
        vendasTotais: dashboardData.vendasTotais,
        encomendas: dashboardData.encomendas
    });
};

/**
 * Exibe a página de gestão de produtos.
 */
supermarketController.exibirProdutos = async function (req, res) {
    try {
        const produtos = await supermarketService.getProductByUser(req.user.id);
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
 * O produto é carregado pelo middleware router.param('productId')
 */
supermarketController.exibirDetalhes = async function (req, res) {
    res.render('supermercado/detalhesProduto', {
        title: 'Detalhes do Produto',
        produto: req.produto
    });
};

/**
 * Exibe o formulário para editar um produto.
 * O produto é carregado pelo middleware router.param('productId')
 */
supermarketController.exibirFormularioEditar = async function (req, res) {
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
        await supermarketService.createProduct(req.user.id, { ...req.body, imagem });

        res.redirect('/supermercado/produtos');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao guardar produto.');
    }
};

/**
 * Processa a atualização de um produto existente (com imagem).
 * O produto é carregado pelo middleware router.param('productId')
 */
supermarketController.atualizarProduto = async function (req, res) {
    try {
        const dados = { ...req.body };
        if (req.file) {
            dados.imagem = `/images/produtos/${req.file.filename}`;
        }

        await supermarketService.updateProductByIdForUser(req.user.id, req.produto._id, dados);
        res.redirect('/supermercado/produtos');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao atualizar produto.');
    }
};

/**
 * Elimina um produto.
 * O produto é carregado pelo middleware router.param('productId')
 */
supermarketController.eliminarProduto = async function (req, res) {
    try {
        await supermarketService.deleteProductByIdForUser(req.user.id, req.produto._id);
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
        const produtos = await supermarketService.searchProducts(req.user.id, {
            q,
            categoria
        });
        res.json(produtos);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao pesquisar produtos.' });
    }
};

/**
 * Exibe o formulário de edição dos dados do supermercado.
 */
supermarketController.exibirEditarSupermercado = async function (req, res) {
    try {
        const supermercado = await supermarketService.getSupermarketByUserId(req.user.id);
        res.render('supermercado/editarSupermercado', {
            title: 'Editar Supermercado',
            supermercado
        });
    } catch (err) {
        res.status(500).send('Erro ao carregar dados do supermercado.');
    }
};

/**
 * Guarda as alterações aos dados do supermercado.
 */
supermarketController.atualizarSupermercado = async function (req, res) {
    try {
        const { nome, descricao, latitude, longitude, horarioFuncionamento, metodosEntrega, custoEntrega, raioAtuacao } = req.body;

        await supermarketService.updateSupermarketByUserId(req.user.id, {
            nome, 
            descricao, 
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
        const supermercado = await supermarketService.getSupermarketByUserId(req.user.id);

        res.render('supermercado/perfil', {
            title: 'Meu Perfil',
            utilizador,
            supermercado
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
        const encomendas = await supermarketService.getOrdersByUserId(req.user.id);

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
 * A encomenda é verificada pelo middleware router.param('orderId')
 */
supermarketController.atualizarEstadoEncomenda = async function (req, res) {
    try {
        const { estado } = req.body;
        await supermarketService.updateOrderStatusByIdForUser(
            req.user.id,
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
        const produtos = await supermarketService.getAvailableProductsForSaleByUserId(req.user.id);

        res.render('supermercado/vendaCaixa', {
            title: 'Registar Venda',
            produtos
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
        const { emailCliente, nomeCliente, telefoneCliente, moradaCliente, itens } = req.body;
        const listaItens = JSON.parse(itens);

        await supermarketService.registerSale(req.user.id, {
            emailCliente, nomeCliente, telefoneCliente, moradaCliente, listaItens
        });

        res.redirect('/supermercado/encomendas');
    } catch (err) {
        console.error(err);
        res.status(400).send(err.message || 'Erro ao registar venda.');
    }
};

module.exports = supermarketController;