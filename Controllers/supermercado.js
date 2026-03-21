const Product = require('../models/ProductModel');
const Supermarket = require('../models/SupermarketModel');

/**
 * Exibe a Dashboard do Supermercado.
 */
const exibirDashboard = async (req, res) => {
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
        if (!produto) {
            return res.status(404).send('Produto não encontrado');
        }

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
 * Processa a criação de um novo produto.
 */
const criarProduto = async (req, res) => {
    try {
        const { nome, descricao, categoria, preco, stock } = req.body;

        await Product.create({
            nome,
            descricao,
            categoria,
            preco,
            stockDisponivel: stock,
            supermercadoId: req.user.id
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

/**
 * API — Pesquisar produtos (devolve JSON para o fetch do browser).
 * Exemplo: GET /supermercado/api/produtos?q=leite&categoria=Laticinios
 */
const pesquisarProdutos = async (req, res) => {
    try {
        const { q, categoria } = req.query;

        const filtro = { supermercadoId: req.user.id };

        if (q) {
            filtro.nome = { $regex: q, $options: 'i' };
        }
        if (categoria) {
            filtro.categoria = categoria;
        }

        const produtos = await Product.find(filtro).sort({ nome: 1 });

        res.json(produtos);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao pesquisar produtos.' });
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
    pesquisarProdutos
};