const Product = require('../models/ProductModel');
const Supermarket = require('../models/SupermarketModel');
const Order = require('../models/OrderModel');
const User = require('../models/UserModel');
const Avaliacao = require('../models/AvaliacaoModel');
const mongoose = require('mongoose');
const Category = require('../models/CategoryModel');
const CatalogProduct = require('../models/CatalogProductModel');
const Coupon = require('../models/CupomModel');
const authService = require('./authService');
const orderService = require('./orderService');

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
    return Supermarket.find({ estadoAprovacao: 'Aprovado' }).select('_id nome descricao localizacao localizacaoGeo raioEntregaKm custoEntregaPorMetodo');
};

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

supermarketService.obterProdutoPorId = async function (id, supermercadoId = null) {
    const filtro = { _id: id };
    if (supermercadoId) {
        filtro.supermercadoId = supermercadoId;
    }
    return Product.findOne(filtro).populate('categoriaId');
};

function validarOuGerarEAN(codigo) {
    const eanRegex = /^\d{12,13}$/;
    if (codigo && eanRegex.test(codigo.trim())) {
        return codigo.trim();
    }
    return Math.floor(100000000000 + Math.random() * 900000000000).toString();
}

supermarketService.criarProduto = async function (supermercadoId, productData) {
    let catalogProductId = productData.catalogProductId || null;
    let nome = productData.nome?.trim();
    let categoriaId = productData.categoriaId;

    // Se o utilizador não selecionou um ID de catálogo, tentamos encontrar pelo Nome (Case-Insensitive)
    if (!catalogProductId && nome) {
        let porNome = await CatalogProduct.findOne({ nome: { $regex: new RegExp('^' + nome + '$', 'i') } });
        if (porNome) {
            catalogProductId = porNome._id;
            nome = porNome.nome; // Usar o nome oficial do catálogo
            categoriaId = porNome.categoriaId;
        } else {
            // Se o produto não existe no catálogo global, cria-se agora
            const novoCatalogo = await CatalogProduct.create({
                nome: nome,
                categoriaId: categoriaId,
                descricao: productData.descricao || ''
            });
            catalogProductId = novoCatalogo._id;
        }
    } else if (catalogProductId) {
        // Se o utilizador selecionou um ID de catálogo da lista, garantir que usamos o nome e categoria desse catálogo
        const catalogo = await CatalogProduct.findById(catalogProductId);
        if (catalogo) {
            nome = catalogo.nome;
            categoriaId = catalogo.categoriaId;
        }
    }

    const novoProduto = new Product({
        supermercadoId,
        catalogProductId,
        nome,
        descricao: productData.descricao,
        categoriaId,
        preco: productData.preco,
        precoAntigo: productData.precoAntigo || 0,
        stockDisponivel: productData.stockDisponivel,
        imagem: productData.imagem,
        iva: productData.iva || 23,
        codigoBarras: productData.codigoBarras || validarOuGerarEAN(null)
    });

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
        { returnDocument: 'after', runValidators: true, context: 'query' }
    );
};

supermarketService.listarProdutosGeral = async function (supermercadoId) {
    const query = supermercadoId ? { supermercadoId } : {};
    return Product.find(query)
        .sort({ criadoEm: -1 })
        .populate('categoriaId', 'nome');
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
        Product.find(filtro).sort({ nome: 1 }).populate('categoriaId').skip(Number(skip)).limit(Number(limite)),
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
            disponivel,
            solicitado: item.quantidade,
            erro
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
        dadosSupermercado.custoEntregaPorMetodo = {
            levantamento_loja: 0,
            entrega_domicilio: custoEntregaPorMetodo.entrega_domicilio !== undefined ? (parseFloat(custoEntregaPorMetodo.entrega_domicilio) || 0) : null
        };
    }

    return Supermarket.findByIdAndUpdate(supermercadoId, dadosSupermercado, { new: true, runValidators: true });
};



supermarketService.obterEncomendas = async function (supermercadoId, pagina = 1, limite = 5, filtroEstado = null) {
    const skip = (pagina - 1) * limite;
    const query = { supermercadoId };
    if (filtroEstado) query.estado = filtroEstado;

    const [encomendas, total] = await Promise.all([
        Order.find(query).populate('clienteId', 'nome email telefone').sort({ criadoEm: -1 }).skip(skip).limit(limite),
        Order.countDocuments(query)
    ]);

    return { encomendas, paginaAtual: pagina, totalPaginas: Math.ceil(total / limite) || 1 };
};

supermarketService.obterEncomendaPorId = async function (supermercadoId, orderId) {
    return Order.findOne({ _id: orderId, supermercadoId }).populate('clienteId', 'nome email telefone');
};

function transicoesPermitidasParaEncomenda(encomenda) {
    const eLoja = encomenda.metodoEntrega === 'levantamento_loja';

    return {
        pendente:           ['em_preparacao', 'cancelada'],
        em_preparacao:      ['confirmada', 'cancelada'],
        confirmada:         eLoja ? ['entregue', 'cancelada'] : [], // Se for estafeta, o supermercado para aqui
        em_entrega:         [],
        aguarda_validacao:  [],
        entregue:           [],
        cancelada:          [],
    };
}

supermarketService.transicoesPermitidasParaEncomenda = transicoesPermitidasParaEncomenda;

supermarketService.atualizarEstadoEncomenda = async function (supermercadoId, orderId, estado) {
    const order = await Order.findOne({ _id: orderId, supermercadoId });
    if (!order) return null;

    const estadoAnterior = order.estado;
    if (estadoAnterior === estado) return order;

    const permitidos = transicoesPermitidasParaEncomenda(order)[estadoAnterior] || [];
    if (!permitidos.includes(estado)) {
        throw new Error(`Transição de estado inválida: ${estadoAnterior} → ${estado}`);
    }

    // Se estiver a cancelar, repor stock. Se for um estado que não tinha stock e agora tem (ex: de cancelada para confirmada), retirar.
    // Mas no nosso fluxo simplificado, apenas tratamos o cancelamento para repor.
    if (estado === 'cancelada' && estadoAnterior !== 'cancelada') {
        await orderService.reporStock(order.produtos);
    }

    if (estado === 'confirmada') order.confirmadaEm = new Date();

    order.estado = estado;
    return order.save();
};

/**
 * Regista uma venda feita diretamente na caixa do supermercado (POS).
 */
supermarketService.registarVenda = async function (supermercadoId, saleData) {
    const { 
        listaItens, 
        metodoEntrega, 
        moradaCliente, 
        nifCliente, 
        nomeCliente, 
        telefoneCliente, 
        emailCliente,
        latitudeEntrega,
        longitudeEntrega 
    } = saleData;

    // Adaptar formato para o OrderService
    const produtos = listaItens.map(item => ({
        produtoId: item.produtoId,
        quantidade: item.quantidade
    }));

    return orderService.criarEncomenda(null, {
        supermercadoId,
        produtos,
        metodoEntrega,
        moradaEntrega: moradaCliente,
        coordenadasEntrega: (latitudeEntrega && longitudeEntrega) ? { lat: Number(latitudeEntrega), lng: Number(longitudeEntrega) } : undefined,
        origem: 'caixa',
        clienteSnapshot: {
            nome: nomeCliente,
            nif: nifCliente,
            morada: moradaCliente,
            email: emailCliente,
            telefone: telefoneCliente
        }
    });
};

supermarketService.obterPromocoesHome = async function () {
    // 1. Encontrar lojas com maiores descontos médios nos produtos
    const lojas = await Product.aggregate([
        { $match: { precoAntigo: { $gt: 0 } } },
        {
            $group: {
                _id: "$supermercadoId",
                maiorDesconto: { $max: { $subtract: ["$precoAntigo", "$preco"] } },
                mediaDesconto: { $avg: { $divide: [{ $subtract: ["$precoAntigo", "$preco"] }, "$precoAntigo"] } }
            }
        },
        { $sort: { mediaDesconto: -1 } },
        { $limit: 3 },
        {
            $lookup: {
                from: "supermarkets",
                localField: "_id",
                foreignField: "_id",
                as: "info"
            }
        },
        { $unwind: "$info" },
        {
            $project: {
                nome: "$info.nome",
                localizacao: "$info.localizacao",
                mediaDescontoPercent: { $multiply: ["$mediaDesconto", 100] }
            }
        }
    ]);

    // 2. Obter cupões ativos
    const cupoes = await Coupon.find({ ativo: true, prazo: { $gte: new Date() } })
        .populate('supermercadoId', 'nome')
        .limit(4);

    return { lojas, cupoes };
};

supermarketService.listarCategorias = async function () {
    return Category.find().sort({ nome: 1 });
};

supermarketService.listarCatalogo = async function () {
    return CatalogProduct.find().populate('categoriaId', 'nome').sort({ nome: 1 });
};

module.exports = supermarketService;
