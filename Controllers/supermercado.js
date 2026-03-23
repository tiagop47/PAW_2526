const Product = require('../models/ProductModel');
const Supermarket = require('../models/SupermarketModel');
const Order = require('../models/OrderModel');
const User = require('../models/UserModel');

/**
 * Exibe a Dashboard do Supermercado (com dados reais).
 */
const exibirDashboard = async (req, res) => {
    try {
        const supermercado = await Supermarket.findOne({ userId: req.user.id });
        const totalProdutos = await Product.countDocuments({ supermercadoId: supermercado._id });
        const totalEncomendas = await Order.countDocuments({ supermercadoId: supermercado._id });

        const encomendas = await Order.find({ supermercadoId: supermercado._id })
            .populate('clienteId', 'nome')
            .sort({ criadoEm: -1 })
            .limit(5);

        // Calcular vendas totais
        const todasEncomendas = await Order.find({ supermercadoId: supermercado._id });
        const vendasTotais = todasEncomendas.reduce((soma, e) => soma + e.valorTotal, 0);

        res.render('supermercado/dashboard', {
            title: 'Dashboard Supermercado',
            totalProdutos,
            totalEncomendas,
            vendasTotais,
            encomendas
        });
    } catch (err) {
        console.error(err);
        res.render('supermercado/dashboard', {
            title: 'Dashboard Supermercado',
            totalProdutos: 0,
            totalEncomendas: 0,
            vendasTotais: 0,
            encomendas: []
        });
    }
};

/**
 * Exibe a página de gestão de produtos.
 */
const exibirProdutos = async (req, res) => {
    try {
        const supermercado = await Supermarket.findOne({ userId: req.user.id });
        const produtos = await Product.find({ supermercadoId: supermercado._id });
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
 * Processa a criação de um novo produto (com imagem).
 */
const criarProduto = async (req, res) => {
    try {
        const supermercado = await Supermarket.findOne({ userId: req.user.id });
        const { nome, descricao, categoria, preco, stock } = req.body;
        const imagem = req.file ? '/images/produtos/' + req.file.filename : '';

        await Product.create({
            nome,
            descricao,
            categoria,
            preco,
            stockDisponivel: stock,
            imagem,
            supermercadoId: supermercado._id
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
 * API — Pesquisar produtos (devolve JSON para o fetch do browser).
 */
const pesquisarProdutos = async (req, res) => {
    try {
        const { q, categoria } = req.query;
        const supermercado = await Supermarket.findOne({ userId: req.user.id });
        const filtro = { supermercadoId: supermercado._id };

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

// ─── Editar dados do Supermercado ───

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

        // metodosEntrega vem como array de checkboxes ou string
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

// ─── Perfil do utilizador ───

/**
 * Exibe o perfil do utilizador autenticado.
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

// ─── Gestão de Encomendas ───

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
        const estadosValidos = ['pendente', 'confirmada', 'em preparação', 'em entrega', 'entregue', 'cancelada'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).send('Estado inválido.');
        }

        await Order.findByIdAndUpdate(req.params.id, { estado });
        res.redirect('/supermercado/encomendas');
    } catch (err) {
        res.status(500).send('Erro ao atualizar estado.');
    }
};

// ─── Venda em Caixa ───

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
 * Cria o cliente se não existir, desconta stock, cria Order.
 */
const registarVenda = async (req, res) => {
    try {
        const { emailCliente, nomeCliente, telefoneCliente, moradaCliente, itens } = req.body;
        const supermercado = await Supermarket.findOne({ userId: req.user.id });

        // Procurar ou criar cliente
        let cliente = await User.findOne({ email: emailCliente });
        if (!cliente) {
            const bcrypt = require('bcrypt');
            const passwordTemp = 'Temp1234'; // password temporária
            const hash = await bcrypt.hash(passwordTemp, 12);
            cliente = await User.create({
                nome: nomeCliente || 'Cliente Loja',
                email: emailCliente,
                password: hash,
                telefone: telefoneCliente || '000000000',
                morada: moradaCliente || 'Compra em loja',
                role: 'clientes'
            });
        }

        // Processar itens: vem como JSON string do formulário
        let listaItens;
        try {
            listaItens = JSON.parse(itens);
        } catch (e) {
            return res.status(400).send('Dados dos produtos inválidos.');
        }

        if (!listaItens || listaItens.length === 0) {
            return res.status(400).send('Adicione pelo menos um produto.');
        }

        // Construir array de produtos e calcular total
        const produtosEncomenda = [];
        let valorTotal = 0;

        for (const item of listaItens) {
            const produto = await Product.findById(item.produtoId);
            if (!produto || produto.stockDisponivel < item.quantidade) {
                return res.status(400).send(`Stock insuficiente para ${produto ? produto.nome : 'produto desconhecido'}.`);
            }

            produtosEncomenda.push({
                produtoId: produto._id,
                quantidade: item.quantidade,
                precoUnitario: produto.preco
            });
            valorTotal += produto.preco * item.quantidade;

            // Descontar stock
            produto.stockDisponivel -= item.quantidade;
            await produto.save();
        }

        // Criar encomenda como "entregue" (venda em caixa = levantamento imediato)
        await Order.create({
            supermercadoId: supermercado._id,
            clienteId: cliente._id,
            produtos: produtosEncomenda,
            valorTotal,
            estado: 'entregue',
            metodoEntrega: 'levantamento em loja'
        });

        res.redirect('/supermercado/encomendas');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao registar venda.');
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