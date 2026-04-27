const Product = require('../models/ProductModel');
const Supermarket = require('../models/SupermarketModel');
const Order = require('../models/OrderModel');
const User = require('../models/UserModel');
const Avaliacao = require('../models/AvaliacaoModel');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const config = require('../config/config');
const authService = require('./authService');

const Category = require('../models/CategoryModel');
const CatalogProduct = require('../models/CatalogProductModel');

const supermarketService = {};

supermarketService.obterDadosDashboard = async function (supermercadoId) {
    const [totalProdutos, totalEncomendas, encomendas, vendasStats, top5Produtos, avaliacaoStats, encomendasPendentes, stockBaixo] = await Promise.all([
        Product.countDocuments({ supermercadoId }),
        Order.countDocuments({ supermercadoId, estado: { $ne: 'cancelada' } }),
        Order.find({ supermercadoId })
            .populate('clienteId', 'nome')
            .sort({ criadoEm: -1 })
            .limit(5),
        Order.aggregate([
            {
                $match: {
                    supermercadoId: new mongoose.Types.ObjectId(supermercadoId),
                    estado: { $ne: 'cancelada' }
                }
            },
            { $group: { _id: null, total: { $sum: "$valorTotal" } } }
        ]),
        Order.aggregate([
            {
                $match: {
                    supermercadoId: new mongoose.Types.ObjectId(supermercadoId),
                    estado: 'entregue'
                }
            },
            { $unwind: '$produtos' },
            {
                $group: {
                    _id: '$produtos.produtoId',
                    totalVendido: { $sum: '$produtos.quantidade' },
                    faturado: { $sum: { $multiply: ['$produtos.quantidade', '$produtos.precoUnitario'] } }
                }
            },
            { $sort: { totalVendido: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'detalhes'
                }
            },
            { $unwind: '$detalhes' },
            {
                $project: {
                    nome: '$detalhes.nome',
                    totalVendido: 1,
                    faturado: 1
                }
            }
        ]),
        Avaliacao.aggregate([
            { $match: { supermercadoId: new mongoose.Types.ObjectId(supermercadoId) } },
            { $group: { _id: null, media: { $avg: '$notaSupermercado' }, total: { $sum: 1 } } }
        ]),
        Order.countDocuments({ supermercadoId, estado: 'pendente' }),
        Product.countDocuments({ supermercadoId, stockDisponivel: { $lt: 5 } })
    ]);

    const vendasTotais = vendasStats.length > 0 ? vendasStats[0].total : 0;
    const valorMedio = totalEncomendas > 0 ? parseFloat((vendasTotais / totalEncomendas).toFixed(2)) : 0;

    return {
        totalProdutos,
        totalEncomendas,
        vendasTotais,
        valorMedio,
        encomendasPendentes,
        encomendas,
        top5Produtos,
        mediaAvaliacao: avaliacaoStats.length > 0 ? parseFloat(avaliacaoStats[0].media.toFixed(1)) : null,
        totalAvaliacoes: avaliacaoStats.length > 0 ? avaliacaoStats[0].total : 0,
        stockBaixo
    };
};

supermarketService.getAllSupermercados = async function () {
    const supermercado = await Supermarket.find({ estadoAprovacao: 'Aprovado' }).select('_id nome descricao localizacao localizacaoGeo raioEntregaKm custoEntregaPorMetodo');
    return supermercado;
}

supermarketService.getSupermercado = async function (userId) {
    return Supermarket.findOne({ userId }).populate('userId', 'nif');
};

supermarketService.obterProdutos = async function (supermercadoId, pagina = 1, limite = 5) {
    const skip = (pagina - 1) * limite;
    const [produtos, total] = await Promise.all([
        Product.find({ supermercadoId }).populate('categoriaId').sort({ criadoEm: -1 }).skip(skip).limit(limite),
        Product.countDocuments({ supermercadoId })
    ]);
    return { produtos, total, totalPaginas: Math.ceil(total / limite) };
};

/**
 * Obter um único produto pelo ID.
 * Se passar supermercadoId, garante que o produto pertence a esse supermercado (Segurança no Backoffice).
 */
supermarketService.obterProdutoPorId = async function (id, supermercadoId = null) {
    const filtro = { _id: id };
    if (supermercadoId) {
        filtro.supermercadoId = supermercadoId;
    }
    return Product.findOne(filtro).populate('categoriaId');
};

/**
 * Garante que o código de barras é um EAN-13 válido (12 ou 13 dígitos).
 * Se não for, gera um aleatório.
 */
function validarOuGerarEAN(codigo) {
    const eanRegex = /^\d{12,13}$/;
    if (codigo && eanRegex.test(codigo.trim())) {
        return codigo.trim();
    }
    // Gera 12 dígitos aleatórios (o 13º será o checksum no JSBarcode)
    return Math.floor(100000000000 + Math.random() * 900000000000).toString();
}

supermarketService.criarProduto = async function (supermercadoId, productData) {
    let catalogProductId = productData.catalogProductId || null;
    let nome = productData.nome;
    let categoriaId = productData.categoriaId;

    // Se o utilizador selecionou um produto do catálogo, copiar nome e categoria
    if (catalogProductId) {
        const catalogo = await CatalogProduct.findById(catalogProductId);
        if (catalogo) {
            nome = catalogo.nome;
            categoriaId = catalogo.categoriaId;
        }
    } else if (nome) {
        // Se não selecionou catálogo, criar automaticamente uma entrada no catálogo
        let catalogo = await CatalogProduct.findOne({ nome: { $regex: new RegExp('^' + nome.trim() + '$', 'i') } });
        if (!catalogo) {
            catalogo = await CatalogProduct.create({
                nome: nome.trim(),
                categoriaId: categoriaId,
                descricao: productData.descricao || ''
            });
        }
        catalogProductId = catalogo._id;
    }

    const novoProduto = new Product({
        supermercadoId: supermercadoId,
        catalogProductId: catalogProductId,
        nome: nome,
        descricao: productData.descricao,
        categoriaId: categoriaId,
        preco: productData.preco,
        precoAntigo: productData.precoAntigo || 0,
        stockDisponivel: productData.stockDisponivel,
        imagem: productData.imagem
    });

    novoProduto.codigoBarras = validarOuGerarEAN(productData.codigoBarras);

    return novoProduto.save();
};

supermarketService.atualizarProduto = async function (supermercadoId, productId, updateData) {
    const camposParaAtualizar = {
        nome: updateData.nome,
        descricao: updateData.descricao,
        categoriaId: updateData.categoriaId,
        preco: updateData.preco,
        precoAntigo: updateData.precoAntigo || 0,
        stockDisponivel: updateData.stockDisponivel,
        codigoBarras: validarOuGerarEAN(updateData.codigoBarras)
    };


    if (updateData.imagem) {
        camposParaAtualizar.imagem = updateData.imagem;
    }

    return Product.findOneAndUpdate(
        { _id: productId, supermercadoId: supermercadoId },
        camposParaAtualizar,
        {
            returnDocument: 'after',
            runValidators: true,
            context: 'query'
        }
    );
};

/**
 * Listagem geral de produtos para o Frontoffice
 */
supermarketService.listarProdutosGeral = async function (supermercadoId) {
    const query = {};
    if (supermercadoId) {
        query.supermercadoId = supermercadoId;
    }
    return Product.find(query)
        .sort({ criadoEm: -1 })
        .populate('categoriaId', 'nome')
        .populate('catalogProductId', 'nome categoriaId');
};

supermarketService.compararProdutosPorNome = async function (nome) {
    return Product.find({ nome: { $regex: nome, $options: 'i' } })
        .populate('supermercadoId', 'nome localizacao')
        .populate('categoriaId', 'nome')
        .sort({ preco: 1 });
};

supermarketService.pesquisarProdutos = async function (supermercadoId, { q, categoriaId, pagina = 1, limite = 5 }) {
    const filtro = { supermercadoId };

    if (q) {
        filtro.$or = [
            { nome: { $regex: q, $options: 'i' } },
            { codigoBarras: { $regex: q, $options: 'i' } }
        ];
    }

    if (categoriaId) {
        filtro.categoriaId = categoriaId;
    }

    const skip = (pagina - 1) * limite;
    const [produtos, total] = await Promise.all([
        Product.find(filtro)
            .sort({ nome: 1 })
            .populate('categoriaId')
            .skip(Number(skip))
            .limit(Number(limite)),
        Product.countDocuments(filtro)
    ]);

    return {
        produtos,
        totalPaginas: Math.ceil(total / limite),
        paginaAtual: Number(pagina),
        totalResultados: total
    };
};

supermarketService.verificarStock = async function (supermercadoId, itens) {
    const resultados = [];
    let todosDisponiveis = true;

    for (const item of itens) {
        const produto = await Product.findOne({ _id: item.produtoId, supermercadoId });

        const disponivel = produto ? produto.stockDisponivel : 0;
        const erro = !produto || disponivel < item.quantidade;

        if (erro) todosDisponiveis = false;

        resultados.push({
            produtoId: item.produtoId,
            nome: produto ? produto.nome : 'Produto desconhecido',
            disponivel: disponivel,
            solicitado: item.quantidade,
            erro: erro

        });
    }

    return { sucesso: todosDisponiveis, resultados };

};

supermarketService.atualizarSupermercado = async function (supermercadoId, dadosSupermercado) {
    const { latitude, longitude, custoEntregaPorMetodo, raioEntregaKm } = dadosSupermercado;

    if (raioEntregaKm !== undefined) {
        dadosSupermercado.raioEntregaKm = parseInt(raioEntregaKm, 10) || 5;
    }

    if (latitude && longitude) {
        dadosSupermercado.localizacaoGeo = {
            type: 'Point',
            coordinates: [Number.parseFloat(longitude), Number.parseFloat(latitude)]
        };
    }

    if (custoEntregaPorMetodo) {
        // Se a chave não vier no req.body (input disabled), fica null no modelo
        dadosSupermercado.custoEntregaPorMetodo = {
            levantamento_loja: 0,
            entrega_domicilio: custoEntregaPorMetodo.entrega_domicilio !== undefined ? (parseFloat(custoEntregaPorMetodo.entrega_domicilio) || 0) : null
        };
    }

    return Supermarket.findByIdAndUpdate(supermercadoId, dadosSupermercado, { new: true, runValidators: true });
};

supermarketService.getUserByIdSemPassword = async function (userId) {
    return authService.getUserByIdSemPassword(userId);
};

supermarketService.obterEncomendas = async function (supermercadoId, pagina = 1, limite = 5, filtroEstado = null) {
    const contador = (pagina - 1) * limite;

    const query = { supermercadoId };
    if (filtroEstado) {
        query.estado = filtroEstado;
    }

    const [encomendas, total] = await Promise.all([
        Order.find(query)
            .populate('clienteId', 'nome email telefone')
            .sort({ criadoEm: -1 })
            .skip(contador)
            .limit(limite),
        Order.countDocuments(query)
    ]);

    return {
        encomendas,
        paginaAtual: pagina,
        totalPaginas: Math.ceil(total / limite) || 1
    };
};

supermarketService.obterEncomendaPorId = async function (supermercadoId, orderId) {
    return Order.findOne({ _id: orderId, supermercadoId })
        .populate('clienteId', 'nome email telefone');
};
function transicoesPermitidasParaEncomenda(encomenda) {
    const eLoja = encomenda.metodoEntrega === 'levantamento_loja';
    const isOnline = encomenda.origem === 'online';

    return {
        pendente:               ['confirmada', 'cancelada'],
        confirmada:             eLoja 
                                    ? (isOnline ? ['em_preparacao', 'entregue', 'cancelada'] : ['entregue', 'cancelada']) 
                                    : ['cancelada'],
        em_preparacao:          eLoja ? ['entregue', 'cancelada'] : [],
        em_entrega:             [], // Supermercado não tem autoridade após a saída para entrega
        aguarda_validacao:      [],
        entregue:               [],
        cancelada:              [],
    };
}

supermarketService.transicoesPermitidasParaEncomenda = transicoesPermitidasParaEncomenda;

supermarketService.atualizarEstadoEncomenda = async function (supermercadoId, orderId, estado) {
    const order = await Order.findOne({ _id: orderId, supermercadoId });
    if (!order) {
        return null;
    }

    const estadoAnterior = order.estado;
    if (estadoAnterior === estado) {
        return order;
    }

    const permitidos = transicoesPermitidasParaEncomenda(order)[estadoAnterior] || [];
    if (!permitidos.includes(estado)) {
        throw new Error(`Transição de estado inválida: ${estadoAnterior} → ${estado}`);
    }

    const estadosComStockOcupado = ['pendente', 'confirmada', 'em_preparacao', 'em_entrega', 'aguarda_validacao', 'entregue'];
    const eraOcupado = estadosComStockOcupado.includes(estadoAnterior);
    const vaiSerOcupado = estadosComStockOcupado.includes(estado);

    if (vaiSerOcupado && !eraOcupado) {
        for (const item of order.produtos) {
            const produto = await Product.findOneAndUpdate(
                { _id: item.produtoId, stockDisponivel: { $gte: item.quantidade } },
                { $inc: { stockDisponivel: -item.quantidade } },
                { new: true }
            );

            if (!produto) {
                const pInfo = await Product.findById(item.produtoId);
                throw new Error(`Stock insuficiente: ${pInfo ? pInfo.nome : 'Produto desconhecido'}`);
            }
        }
    }

    if (eraOcupado && !vaiSerOcupado) {
        for (const item of order.produtos) {
            await Product.findByIdAndUpdate(item.produtoId, {
                $inc: { stockDisponivel: item.quantidade }
            });
        }
    }

    //Lógica de fatura: Gerar apenas se entrar num estado "avançado" e ainda não tiver
    const estadosComFatura = ['confirmada', 'em_preparacao', 'em_entrega', 'aguarda_validacao', 'entregue'];
    if (estadosComFatura.includes(estado) && !order.faturaNumero) {
        order.faturaNumero = await gerarNumeroFatura(supermercadoId);
        order.faturaData = new Date();

        const cliente = await User.findById(order.clienteId);
        if (cliente) {
            order.clienteSnapshot = {
                nome: cliente.nome,
                nif: cliente.nif,
                morada: cliente.morada,
                email: cliente.email,
                telefone: cliente.telefone
            };
        }
    }

    // Registar timestamp de confirmação para a regra de cancelamento de 5 minutos
    if (estado === 'confirmada') {
        order.confirmadaEm = new Date();
    }

    order.estado = estado;
    return order.save();
};

supermarketService.registarVenda = async function (supermercadoId, saleData) {
    const { emailCliente, nomeCliente, nifCliente, telefoneCliente, moradaCliente, latitudeEntrega, longitudeEntrega, listaItens, metodoEntrega } = saleData;

    let cliente;

    if (emailCliente) {
        cliente = await User.findOne({ email: emailCliente });

        if (!cliente) {
            throw new Error('O email inserido não está associado a nenhuma conta.');
        }

        if (cliente.role !== 'clientes') {
            throw new Error('Este email pertence a uma conta de ' + cliente.role + '. Apenas clientes podem realizar compras.');
        }

    } else {
        const emailFinal = 'cliente@teste.com';
        const nifFinal = nifCliente || '999999990';

        cliente = await User.findOne({ $or: [{ email: emailFinal }, { nif: nifFinal }] });

        if (!cliente) {
            const passwordTemp = config.DEFAULT_ADMIN_PASSWORD;

            if (!passwordTemp) {
                throw new Error("Esta conta não existe, insira um utilizador válido.");
            }

            const saltRounds = config.SALT_ROUNDS || 10;
            const hash = await bcrypt.hash(passwordTemp, saltRounds);

            cliente = await User.create({
                nome: nomeCliente || 'Consumidor Final',
                email: emailFinal,
                password: hash,
                telefone: telefoneCliente || '900000000',
                nif: nifFinal,
                morada: moradaCliente || 'Venda Local em Loja',
                role: 'clientes'
            });
        }
    }

    const produtosEncomenda = [];
    let valorTotal = 0;

    for (const item of listaItens) {
        const produto = await Product.findOneAndUpdate(
            {
                _id: item.produtoId,
                stockDisponivel: { $gte: item.quantidade }
            },
            {
                $inc: { stockDisponivel: -item.quantidade }
            },
            { new: true, runValidators: true, context: 'query' }
        );

        if (!produto) {
            const pInfo = await Product.findById(item.produtoId);
            throw new Error(`Stock insuficiente ou produto não encontrado: ${pInfo ? pInfo.nome : 'ID ' + item.produtoId}`);
        }

        produtosEncomenda.push({
            produtoId: produto._id,
            quantidade: item.quantidade,
            precoUnitario: produto.preco
        });
        valorTotal += produto.preco * item.quantidade;
    }

    const eDomicilio = metodoEntrega === 'entrega_domicilio';
    // Todas as vendas em caixa entram como confirmada (já pagas/validadas), aguardando levantamento ou estafeta.
    const estadoFinal = 'confirmada';

    const lat = Number(latitudeEntrega);
    const lng = Number(longitudeEntrega);
    const temCoordenadasValidas = Number.isFinite(lat) && Number.isFinite(lng);

    const novaOrdem = new Order({
        supermercadoId,
        clienteId: cliente._id,
        produtos: produtosEncomenda,
        valorTotal,
        metodoPagamento: 'dinheiro',
        estado: estadoFinal,
        origem: 'caixa',
        confirmadaEm: new Date(), // Já nasce validada
        metodoEntrega: eDomicilio ? 'entrega_domicilio' : 'levantamento_loja',
        moradaEntrega: eDomicilio ? (moradaCliente || 'Entrega ao Domicílio') : 'Levantamento em Loja',
        coordenadasEntrega: temCoordenadasValidas ? { lat, lng } : undefined,
        faturaNumero: await gerarNumeroFatura(supermercadoId),
        faturaData: new Date(),
        clienteSnapshot: {
            nome: cliente.nome,
            nif: cliente.nif,
            morada: cliente.morada,
            email: cliente.email,
            telefone: cliente.telefone
        }
    });

    return novaOrdem.save();
};

/**
 * Categorias
 */
supermarketService.listarCategorias = async function () {
    return Category.find().sort({ nome: 1 });
};

/**
 * Catálogo de Produtos Partilhado
 */
supermarketService.listarCatalogo = async function () {
    return CatalogProduct.find().populate('categoriaId', 'nome').sort({ nome: 1 });
};

/**
 * Gera um número de fatura sequencial para um supermercado.
 * Formato: FT <ANO>/<SEQUENCIAL> (ex: FT 2024/0001)
 */
async function gerarNumeroFatura(supermercadoId) {
    const anoAtual = new Date().getFullYear();
    const count = await Order.countDocuments({
        supermercadoId,
        faturaNumero: { $regex: `^FT ${anoAtual}/` }
    });

    const sequencial = (count + 1).toString().padStart(4, '0');
    return `FT ${anoAtual}/${sequencial}`;
}

module.exports = supermarketService;
