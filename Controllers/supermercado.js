const Product = require('../models/ProductModel');
const Supermarket = require('../models/SupermarketModel');

/**
 * Exibe a Dashboard do Supermercado.
 */
const exibirDashboard = async (req, res) => {
    // Aqui no futuro vamos buscar os produtos desta loja
    res.render('supermercado/dashboard', { title: 'Dashboard Supermercado' });
};

/**
 * Exibe a página de gestão de produtos.
 */
const exibirProdutos = async (req, res) => {
    try {
        const produtos = await Product.find();
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
        if (!produto) return res.status(404).send('Produto não encontrado');

        res.render('supermercado/editarProduto', { 
            title: 'Editar Produto',
            produto 
        });
    } catch (err) {
        res.status(500).send('Erro ao carregar formulário de edição.');
    }
};

/**
 * Processa a criação de um novo produto.
 */
const criarProduto = async (req, res) => {
    try {
        const { nome, descricao, categoria, preco, stock } = req.body;
        
        // Criar o produto na base de dados
        await Product.create({
            nome,
            descricao,
            categoria,
            preco,
            stockDisponivel: stock,
            supermercadoId: req.user.id // Atribuímos o ID do utilizador logado
        });

        res.redirect('/supermercado/produtos');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao guardar produto.');
    }
};

/**
 * Processa a atualização de um produto existente.
 */
const atualizarProduto = async (req, res) => {
    try {
        const { nome, descricao, categoria, preco, stock } = req.body;

        await Product.findByIdAndUpdate(req.params.id, {
            nome,
            descricao,
            categoria,
            preco,
            stockDisponivel: stock
        });

        res.redirect('/supermercado/produtos');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao atualizar produto.');
    }
};

module.exports = {
    exibirDashboard,
    exibirProdutos,
    exibirFormularioNovo,
    exibirDetalhes,
    exibirFormularioEditar,
    criarProduto,
    atualizarProduto
};