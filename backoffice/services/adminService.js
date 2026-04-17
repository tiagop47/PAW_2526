const Supermarket = require('../models/SupermarketModel');
const User = require('../models/UserModel');
const Product = require('../models/ProductModel');
const Order = require('../models/OrderModel');
const Category = require('../models/CategoryModel');
const Coupon = require('../models/cupomModel');

const adminService = {};

/**
 * Gestão de Categorias
 */

adminService.listarCategorias = async function () {
    const [categorias, contagens] = await Promise.all([
        Category.find().sort({ nome: 1 }).lean(),
        Product.aggregate([
            { $group: { _id: '$categoriaId', total: { $sum: 1 } } }
        ])
    ]);

    const mapaContagens = {};
    contagens.forEach(c => { mapaContagens[c._id?.toString()] = c.total; });

    return categorias.map(cat => ({
        _id: cat._id,
        nome: cat.nome,
        descricao: cat.descricao,
        criadoEm: cat.criadoEm,
        totalProdutos: mapaContagens[cat._id.toString()] || 0
    }));
};

adminService.criarCategoria = async function (dados) {
    return Category.create(dados);
};

adminService.eliminarCategoria = async function (id) {
    const produtosUsam = await Product.countDocuments({ categoriaId: id });

    if (produtosUsam > 0) {
        let categoriaOutros = await Category.findOne({ nome: 'Outros' });
        if (!categoriaOutros) {
            categoriaOutros = await Category.create({ nome: 'Outros', descricao: 'Categoria padrão para produtos sem categoria' });
        }

        if (id === categoriaOutros._id.toString()) {
            throw new Error('Não é possível eliminar a categoria padrão "Outros".');
        }

        await Product.updateMany({ categoriaId: id }, { categoriaId: categoriaOutros._id });
    }

    return Category.findByIdAndDelete(id);
};

adminService.getDashboardStats = async function () {
    const [totalUsers, totalEstafetas, pendentes, ativos, bloqueados, totalProdutos, totalEncomendas, totalFaturadoAgg] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'estafetas' }),
        Supermarket.countDocuments({ estadoAprovacao: 'Pendente' }),
        Supermarket.countDocuments({ estadoAprovacao: 'Aprovado' }),
        Supermarket.countDocuments({ estadoAprovacao: 'Bloqueado'}),
        Product.countDocuments(),
        Order.countDocuments(),
        Order.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: '$valorTotal' }
                }
            }
        ])
    ]);

    const valorTotal = totalFaturadoAgg[0]?.total || 0;

    return {
        totalUsers,
        totalEstafetas,
        pendentes,
        ativos,
        bloqueados,
        totalProdutos,
        totalEncomendas,
        valorTotal,
    };
};

adminService.getPendentesDocumentos = async function (pagina, limite) {
    const contador = (pagina - 1) * limite;

    const total = await Supermarket.countDocuments({ estadoAprovacao: 'Pendente' });
    const supermercados = await Supermarket.find({ estadoAprovacao: 'Pendente' })
        .populate('userId')
        .sort({ criadoEm: -1 })
        .skip(Number(contador))
        .limit(Number(limite));

    return {
        supermercados,
        totalPaginas: Math.ceil(total / limite)
    };
};

adminService.aprovarSupermercadoById = async function (id) {
    return Supermarket.findByIdAndUpdate(id, { estadoAprovacao: 'Aprovado' });
};

adminService.rejeitarSupermercadoById = async function (id) {
    return Supermarket.findByIdAndUpdate(id, { estadoAprovacao: 'Rejeitado' });
};

adminService.alternarBloqueio = async function (id) {
    const desbloqueado = await Supermarket.findOneAndUpdate(
        { _id: id, estadoAprovacao: 'Bloqueado' },
        { estadoAprovacao: 'Aprovado' },
        { new: true }
    );
    if (desbloqueado) return desbloqueado;

    return Supermarket.findOneAndUpdate(
        { _id: id, estadoAprovacao: { $ne: 'Bloqueado' } },
        { estadoAprovacao: 'Bloqueado' },
        { new: true }
    );
};

adminService.getUsersDocumentos = async function (pagina, limite) {
    const contador = (pagina - 1) * limite;

    const total = await User.countDocuments();
    const users = await User.find()
        .select('-password')
        .sort({ criadoEm: -1 })
        .skip(Number(contador))
        .limit(Number(limite));

    return {
        users,
        totalPaginas: Math.ceil(total / limite)
    };
};

adminService.getEstafetasDocumentos = async function (pagina, limite) {
    const contador = (pagina - 1) * limite;

    const total = await User.countDocuments({ role: 'estafetas' });
    const users = await User.find({ role: 'estafetas' })
        .select('-password')
        .sort({ criadoEm: -1 })
        .skip(Number(contador))
        .limit(Number(limite));

    return {
        users,
        totalPaginas: Math.ceil(total / limite)
    };
};

adminService.getUserByIdSemPassword = async function (id) {
    return User.findById(id).select('-password');
};

adminService.atualizarUserById = async function (id, dados) {
    return User.findByIdAndUpdate(id, dados, {
        new: true,
        runValidators: true
    });
};

adminService.getMercadosAtivos = async function (contador, limite) {
    const total = await Supermarket.countDocuments({ estadoAprovacao: { $in: ['Aprovado', 'Bloqueado'] }});
    const supermercados = await Supermarket.find({ estadoAprovacao: { $in: ['Aprovado', 'Bloqueado'] } })
        .populate('userId')
        .skip(Number(contador))
        .limit(Number(limite));

    return {
        supermercados,
        paginaAtual: Math.floor(Number(contador) / Number(limite)) + 1,
        totalPaginas: Math.ceil(total / limite)
    };
};

adminService.getTodosMercadosAtivos = async function () {
    return Supermarket.find({ estadoAprovacao: 'Aprovado' });
};

/**
 * Obtém todas as encomendas do sistema com paginação.
 */
adminService.getEncomendasPaginadas = async function (pagina, limite) {
    const contador = (pagina - 1) * limite;
    const total = await Order.countDocuments();
    
    const encomendas = await Order.find()
        .populate('clienteId', 'nome email')
        .populate('supermercadoId', 'nome')
        .sort({ criadoEm: -1 })
        .skip(Number(contador))
        .limit(Number(limite));

    return {
        encomendas,
        totalPaginas: Math.ceil(total / limite)
    };
};

/**
 * Obtém uma encomenda específica por ID, populando produtos e supermercado.
 */
adminService.getEncomendaPorId = async function (orderId) {
    return Order.findById(orderId)
        .populate('produtos.produtoId')
        .populate({
            path: 'supermercadoId',
            populate: { path: 'userId', select: 'nif' }
        })
        .populate('clienteId', 'nome email nif morada telefone');
};

/**
 * Obtém os dados da fatura de uma encomenda, validando existência e disponibilidade.
 */
adminService.getFaturaEncomenda = async function (orderId) {
    const encomenda = await adminService.getEncomendaPorId(orderId);

    if (!encomenda) {
        const erro = new Error('Encomenda não encontrada.');
        erro.codigo = 'NAO_ENCONTRADA';
        throw erro;
    }

    if (!encomenda.faturaNumero) {
        const erro = new Error('Esta encomenda ainda não tem uma fatura gerada. A fatura é criada automaticamente quando a encomenda é confirmada ou entregue.');
        erro.codigo = 'SEM_FATURA';
        throw erro;
    }

    return encomenda;
};

/**
 * Eliminar um user e se for do tipo supermercado apaga também o supermercado e os seus produtos.
 */
adminService.eliminarUser = async function (id) {
    const session = await User.startSession();
    session.startTransaction();

    try {
        const user = await User.findById(id).session(session);
        if (!user) throw new Error('Utilizador não encontrado');

        if (user.role === 'supermercados') {
            const supermercado = await Supermarket.findOneAndDelete({ userId: id }, { session });
            if (supermercado) {
                await Product.deleteMany({ supermercadoId: supermercado._id }, { session });
            }
        }

        await User.findByIdAndDelete(id, { session });
        await session.commitTransaction();
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
};

/**
 * Obtém o top 5 de supermercados com mais encomendas.
 */
adminService.getTopSupermercados = async function () {
    const resultado = await Order.aggregate([
        { $group: { _id: '$supermercadoId', counter: { $sum: 1 } } },
        { $sort: { counter: -1 } },
        { $limit: 5 },
        {
            $lookup: {
                from: 'supermarkets',
                localField: '_id',
                foreignField: '_id',
                as: 'supermercado'
            }
        },
        { $unwind: '$supermercado' },
        {
            $project: {
                _id: 0,
                nome: '$supermercado.nome',
                counter: 1
            }
        }
    ]);

    return resultado;
};

/**
 * Evolução de registos de utilizadores
 */

adminService.getRegistosMensais = async function () {
    const ha12Meses = new Date();
    ha12Meses.setMonth(ha12Meses.getMonth() - 12);
    const resultado = await User.aggregate([
        { $match: { criadoEm: { $gte: ha12Meses } } },
        {
            $group: {
                _id: {
                    ano: { $year: '$criadoEm' },
                    mes: { $month: '$criadoEm' }
                },
                total: { $sum: 1 }
            }
        },
        { $sort: { '_id.ano': 1, '_id.mes': 1 } }
    ]);
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return resultado.map(r => ({
        label: meses[r._id.mes - 1] + ' ' + r._id.ano,
        total: r.total
    }));
};

/**
 * Evolução da Faturação por Zona ao longo dos meses
 */
adminService.getFaturacaoPorZona = async function () {
    const ha12Meses = new Date();
    ha12Meses.setMonth(ha12Meses.getMonth() - 12);

    const resultado = await Order.aggregate([
        { $match: { criadoEm: { $gte: ha12Meses } } },
        {
            $lookup: {
                from: 'supermarkets',
                localField: 'supermercadoId',
                foreignField: '_id',
                as: 'supermercado'
            }
        },
        { $unwind: '$supermercado' },
        {
            $group: {
                _id: {
                    zona: '$supermercado.localizacao',
                    ano: { $year: '$criadoEm' },
                    mes: { $month: '$criadoEm' }
                },
                total: { $sum: '$valorTotal' }
            }
        },
        { $sort: { '_id.ano': 1, '_id.mes': 1 } }
    ]);

    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const zonasMap = {};
    const labelsSet = new Set();
    
    resultado.forEach(r => {
        const labelText = meses[r._id.mes - 1] + ' ' + r._id.ano;
        labelsSet.add(labelText);
        
        const zona = r._id.zona || 'Outras Zonas';
        if (!zonasMap[zona]) zonasMap[zona] = {};
        zonasMap[zona][labelText] = r.total;
    });

    const labels = Array.from(labelsSet);
    const colors = ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14', '#20c997', '#e83e8c'];
    
    const datasets = Object.keys(zonasMap).map((zona, index) => {
        return {
            label: zona,
            data: labels.map(l => zonasMap[zona][l] || 0),
            backgroundColor: colors[index % colors.length],
            borderColor: colors[index % colors.length],
            borderWidth: 2,
            tension: 0.3,
            fill: false
        };
    });

    return { labels, datasets };
};

/**
 * Gestão de cupons de desconto
 */

adminService.listarCupoes = async function (){
    return Coupon.find()
        .sort({ criadoEm: -1 });
};

adminService.getLocalidadesSupermercados = async function () {
    const localidades = await Supermarket.distinct('localizacao', { localizacao: { $nin: [null, ""] } });
    return localidades;
};

adminService.criarCupao = async function (dados) {
    if (!dados.localidadeAlvo || dados.localidadeAlvo.trim() === '') {
        delete dados.localidadeAlvo;
    }
    
    if (dados.codigo) {
        dados.codigo = dados.codigo.toUpperCase().trim();
    }

    const novoCupao = await Coupon.create(dados);

    if (novoCupao.localidadeAlvo) {
        await User.updateMany(
            { role: 'clientes', morada: { $regex: new RegExp(novoCupao.localidadeAlvo, 'i') } },
            { $push: { cupoes: novoCupao._id } }
        );
    } else {
        await User.updateMany(
            { role: 'clientes' },
            { $push: { cupoes: novoCupao._id } }
        );
    }

    return novoCupao;
};


module.exports = adminService;
