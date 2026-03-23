const Product = require('../models/ProductModel');
const Supermarket = require('../models/SupermarketModel');
const Order = require('../models/OrderModel');
const User = require('../models/UserModel');
const supermarketService = require('../services/supermarketService');

/**
 * Exibe a Dashboard do Supermercado.
 */
const exibirDashboard = async (req, res) => {
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
const exibirProdutos = async (req, res) => {
    try {
        const produtos = await supermarketService.getProductsByUserId(req.user.id);
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
const exibirFormularioNovo = (req, res) => {
    res.render('supermercado/novoProduto', { title: 'Novo Produto' });
};

/**
 * Exibe os detalhes de um produto.
 */
const exibirDetalhes = async (req, res) => {
    try {
        const produto = await Product.findById(req.params.id);
        if (!produto) return res.status(404).send('Produto não encontrado');

        res.render('supermercado/detalhesProduto', {
            title: 'Detalhes do Produto',
            produto
        });
    } catch (err) {
        res.status(500).send('Erro ao carregar detalhes.');
    }
};

/**
 * Exibe o formulário para editar um produto.
 */
const exibirFormularioEditar = async (req, res) => {
    try {
        const produto = await Product.findById(req.params.id);
        if (!produto) {
            return res.status(404).send('Produto não encontrado');
        }

        res.render('supermercado/editarProduto', {
            title: 'Editar Produto',
            produto
        });
    } catch (err) {
        res.status(500).send('Erro ao carregar formulário de edição.');
    }
};

/**
 * Processa a criação de um novo produto (com imagem).
 */
const criarProduto = async (req, res) => {
    try {
        const { nome, descricao, categoria, preco, stock } = req.body;
        const imagem = req.file ? '/images/produtos/' + req.file.filename : '';

        await supermarketService.createProduct(req.user.id, {
            nome, descricao, categoria, preco, stockDisponivel: stock, imagem
        });

        res.redirect('/supermercado/produtos');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao guardar produto.');
    }
};

/**
 * Processa a atualização de um produto existente (com imagem).
 */
const atualizarProduto = async (req, res) => {
    try {
        const { nome, descricao, categoria, preco, stock } = req.body;
        const dados = { nome, descricao, categoria, preco, stockDisponivel: stock };

        if (req.file) {
            dados.imagem = '/images/produtos/' + req.file.filename;
        }

        await Product.findByIdAndUpdate(req.params.id, dados);
        res.redirect('/supermercado/produtos');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao atualizar produto.');
    }
};

/**
 * Elimina um produto.
 */
const eliminarProduto = async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.redirect('/supermercado/produtos');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao eliminar produto.');
    }
};

/**
 * API — Pesquisar produtos (devolve JSON).
 */
const pesquisarProdutos = async (req, res) => {
    try {
        const { q, categoria } = req.query;
        const produtos = await supermarketService.searchProducts(req.user.id, { q, categoria });
        res.json(produtos);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao pesquisar produtos.' });
    }
};

/**
 * Exibe o formulário de edição dos dados do supermercado.
 */
const exibirEditarSupermercado = async (req, res) => {
    try {
        const supermercado = await Supermarket.findOne({ userId: req.user.id });
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
const atualizarSupermercado = async (req, res) => {
    try {
        const { nome, descricao, localizacao, horarioFuncionamento, metodosEntrega, custoEntrega } = req.body;

        let metodos = metodosEntrega;
        if (typeof metodos === 'string') metodos = [metodos];
        if (!metodos) metodos = ['levantamento em loja'];

        await Supermarket.findOneAndUpdate({ userId: req.user.id }, {
            nome, descricao, localizacao, horarioFuncionamento,
            metodosEntrega: metodos,
            custoEntrega: custoEntrega || 0
        });

        res.redirect('/supermercado/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao atualizar supermercado.');
    }
};

/**
 * Exibe o perfil do utilizador.
 */
const exibirPerfil = async (req, res) => {
    try {
        const utilizador = await User.findById(req.user.id).select('-password');
        const supermercado = await Supermarket.findOne({ userId: req.user.id });

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
const listarEncomendas = async (req, res) => {
    try {
        const supermercado = await Supermarket.findOne({ userId: req.user.id });
        const encomendas = await Order.find({ supermercadoId: supermercado._id })
            .populate('clienteId', 'nome email telefone')
            .sort({ criadoEm: -1 });

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
 */
const atualizarEstadoEncomenda = async (req, res) => {
    try {
        const { estado } = req.body;
        await Order.findByIdAndUpdate(req.params.id, { estado });
        res.redirect('/supermercado/encomendas');
    } catch (err) {
        res.status(500).send('Erro ao atualizar estado.');
    }
};

/**
 * Exibe o formulário de venda em caixa.
 */
const exibirVendaCaixa = async (req, res) => {
    try {
        const supermercado = await Supermarket.findOne({ userId: req.user.id });
        const produtos = await Product.find({ supermercadoId: supermercado._id, stockDisponivel: { $gt: 0 } });

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
const registarVenda = async (req, res) => {
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

module.exports = {
    exibirDashboard,
    exibirProdutos,
    exibirFormularioNovo,
    exibirDetalhes,
    exibirFormularioEditar,
    criarProduto,
    atualizarProduto,
    eliminarProduto,
    pesquisarProdutos,
    exibirEditarSupermercado,
    atualizarSupermercado,
    exibirPerfil,
    listarEncomendas,
    atualizarEstadoEncomenda,
    exibirVendaCaixa,
    registarVenda
};
