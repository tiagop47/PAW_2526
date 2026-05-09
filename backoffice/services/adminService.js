const Supermarket = require('../models/SupermarketModel');
const User = require('../models/UserModel');
const Product = require('../models/ProductModel');
const Order = require('../models/OrderModel');
const Category = require('../models/CategoryModel');
const Coupon = require('../models/CupomModel');
const emailService = require('./emailService');
const authService = require('./authService');

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
    const { nome, descricao } = dados;
    return Category.create({ nome, descricao });
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
    const [totalUsers, totalEstafetas, pendentesSupermercados, pendentesEstafetas, ativos, bloqueados, totalProdutos, totalEncomendas, totalFaturadoAgg, backlogEntregas] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'estafetas' }),
        Supermarket.countDocuments({ 
            $or: [
                { estadoAprovacao: 'Pendente' },
                { estadoAprovacao: 'Bloqueado' },
                { userId: null }
            ]
        }),
        User.countDocuments({ role: 'estafetas', bloqueado: true }),
        Supermarket.countDocuments({ estadoAprovacao: 'Aprovado', userId: { $ne: null } }),
        Supermarket.countDocuments({ estadoAprovacao: 'Bloqueado', userId: { $ne: null } }),
        Product.countDocuments(),
        Order.countDocuments(),
        Order.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: '$valorTotal' }
                }
            }
        ]),
        Order.aggregate([
            { $match: { estafetaId: null, estado: 'confirmada', metodoEntrega: 'entrega_domicilio' } },
            { $group: { _id: '$supermercadoId', total: { $sum: 1 } } },
            { $sort: { total: -1 } },
            { $limit: 1 },
            {
                $lookup: {
                    from: 'supermarkets',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'supermercado'
                }
            },
            { $unwind: '$supermercado' }
        ])
    ]);

    const valorTotal = totalFaturadoAgg[0]?.total || 0;
    const mercadoComMaisEntregas = backlogEntregas.length > 0 ? {
        nome: backlogEntregas[0].supermercado.nome,
        localizacao: backlogEntregas[0].supermercado.localizacao,
        total: backlogEntregas[0].total
    } : null;

    const pendentes = pendentesSupermercados + pendentesEstafetas;

    return {
        totalUsers,
        totalEstafetas,
        pendentes,
        ativos,
        bloqueados,
        totalProdutos,
        totalEncomendas,
        valorTotal,
        mercadoComMaisEntregas
    };
};

adminService.getPendentesDocumentos = async function (pagina, limite, filtroTipo = null) {
    const contador = (pagina - 1) * limite;

    const querySupermarket = { 
        $or: [
            { estadoAprovacao: 'Pendente' },
            { estadoAprovacao: 'Bloqueado' },
            { userId: null }
        ]
    };

    const queryEstafetas = { role: 'estafetas', bloqueado: true };
    const queryClientes = { role: 'clientes', bloqueado: true };

    let resultados = [];
    let totalItems = 0;

    if (!filtroTipo || filtroTipo === 'supermercados') {
        const [total, items] = await Promise.all([
            Supermarket.countDocuments(querySupermarket),
            Supermarket.find(querySupermarket).populate('userId').sort({ criadoEm: -1 }).lean()
        ]);
        items.forEach(s => {
            s.tipoPendente = 'Supermercado';
            s.dataPendente = s.criadoEm;
        });
        resultados = resultados.concat(items);
        totalItems += total;
    }

    if (!filtroTipo || filtroTipo === 'estafetas') {
        const [total, items] = await Promise.all([
            User.countDocuments(queryEstafetas),
            User.find(queryEstafetas).select('-password').sort({ criadoEm: -1 }).lean()
        ]);
        items.forEach(e => {
            e.tipoPendente = 'Estafeta';
            e.dataPendente = e.criadoEm;
        });
        resultados = resultados.concat(items);
        totalItems += total;
    }

    if (!filtroTipo || filtroTipo === 'clientes') {
        const [total, items] = await Promise.all([
            User.countDocuments(queryClientes),
            User.find(queryClientes).select('-password').sort({ criadoEm: -1 }).lean()
        ]);
        items.forEach(c => {
            c.tipoPendente = 'Cliente';
            c.dataPendente = c.criadoEm;
        });
        resultados = resultados.concat(items);
        totalItems += total;
    }

    // Ordenar por data (mais recentes primeiro)
    resultados.sort((a, b) => new Date(b.dataPendente) - new Date(a.dataPendente));

    // Paginação manual do array combinado
    const paginados = resultados.slice(contador, contador + limite);

    return {
        itens: paginados,
        totalPaginas: Math.ceil(totalItems / limite) || 1
    };
};

adminService.aprovarSupermercadoById = async function (id) {
    return Supermarket.findByIdAndUpdate(id, { estadoAprovacao: 'Aprovado' });
};

adminService.rejeitarSupermercadoById = async function (id) {
    return Supermarket.findByIdAndUpdate(id, { estadoAprovacao: 'Rejeitado' });
};
/**
 * Este alternarBloqueio é para os supermercados, no Gerir Supermercados
 * */
adminService.alternarBloqueio = async function (id) {
    const desbloqueado = await Supermarket.findOneAndUpdate(
        { _id: id, estadoAprovacao: 'Bloqueado' },
        { estadoAprovacao: 'Aprovado' },
        { new: true }
    );

    if (desbloqueado) {
        return desbloqueado;
    }

    return Supermarket.findOneAndUpdate(
        { _id: id, estadoAprovacao: { $ne: 'Bloqueado' } },
        { estadoAprovacao: 'Bloqueado' },
        { new: true }
    );
};

/**
 * Este é para bloquear qualquer user, no Gerir Utilizadores
 */

adminService.alternarBloqueioUser = async function (id){
    const user = await User.findById(id);

    if(!user){
        throw new Error("Utilizador não encontrado");
    }

    user.bloqueado = !user.bloqueado;
    await user.save();

    return user;
}


adminService.getUsersDocumentos = async function (pagina, limite, filtroRole = null, filtroBloqueado = null) {
    const contador = (pagina - 1) * limite;

    const query = {};
    if (filtroRole) {
        query.role = filtroRole;
    }
    if (filtroBloqueado !== null) {
        query.bloqueado = filtroBloqueado === 'true';
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
        .select('-password')
        .sort({ criadoEm: -1 })
        .skip(Number(contador))
        .limit(Number(limite));

    return {
        users,
        totalPaginas: Math.ceil(total / limite) || 1
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



adminService.atualizarUserById = async function (id, dados) {
    const user = await User.findById(id);
    if (!user) {
        throw new Error("Utilizador não encontrado");
    }

    const roleAntigo = user.role;
    
    // Atualizar os campos permitidos
    if (dados.nome) user.nome = dados.nome;
    if (dados.email) user.email = dados.email;
    if (dados.telefone) user.telefone = dados.telefone;
    if (dados.nif !== undefined) user.nif = dados.nif;
    if (dados.morada) user.morada = dados.morada;
    if (dados.role) user.role = dados.role;

    const userAtualizado = await user.save();

    if (roleAntigo === 'supermercados' && userAtualizado.role !== 'supermercados') {
        // Bloqueamos o supermercado associado e removemos o proprietário para garantir integridade
        await Supermarket.findOneAndUpdate(
            { userId: id },
            { $set: { userId: null, estadoAprovacao: 'Bloqueado' } }
        );
    }

    return userAtualizado;
};

/**
 * Obtém utilizadores com role 'supermercados' que ainda não possuem um supermercado associado.
 */
adminService.getUtilizadoresCandidatos = async function () {
    const usersComRole = await User.find({ role: 'supermercados' }).select('_id nome email').lean();
    const idsComSupermercado = await Supermarket.distinct('userId');

    // Filtrar utilizadores que NÃO estão na lista de IDs que já têm supermercado
    // Filtramos o null do array de IDs antes de fazer toString()
    const idsSet = new Set(idsComSupermercado.filter(id => id).map(id => id.toString()));
    return usersComRole.filter(u => !idsSet.has(u._id.toString()));
};

/**
 * Transfere a propriedade de um supermercado para um novo utilizador.
 */
adminService.transferirPropriedade = async function (supermercadoId, novoUserId) {
    const novoDono = await User.findById(novoUserId);
    if (!novoDono || novoDono.role !== 'supermercados') {
        throw new Error('O novo dono tem de ter a role de supermercados.');
    }

    const jaTem = await Supermarket.findOne({ userId: novoUserId });
    if (jaTem) {
        throw new Error('Este utilizador já é dono de outro supermercado.');
    }

    return Supermarket.findByIdAndUpdate(supermercadoId, {
        userId: novoUserId,
        estadoAprovacao: 'Pendente'
    }, { new: true });
};

/**
 * Obtém todos os produtos do sistema com paginação e filtro opcional por supermercado.
 */
adminService.getProdutosPaginados = async function (pagina, limite, supermercadoId = null) {
    const contador = (pagina - 1) * limite;
    const filtro = {};
    if (supermercadoId) {
        filtro.supermercadoId = supermercadoId;
    }

    const total = await Product.countDocuments(filtro);
    const produtos = await Product.find(filtro)
        .populate('supermercadoId', 'nome')
        .populate('categoriaId', 'nome')
        .sort({ criadoEm: -1 })
        .skip(Number(contador))
        .limit(Number(limite));

    return {
        produtos,
        totalPaginas: Math.ceil(total / limite)
    };
};

/**
 * Obtém os dados necessários para a página de moderação de produtos.
 */
adminService.obterDadosModeracaoProdutos = async function (pagina, limite, supermercadoId) {
    const dadosPagina = await adminService.getProdutosPaginados(pagina, limite, supermercadoId);
    const supermercados = await adminService.getTodosMercadosAtivos();

    let paginaUrl = '/admin/produtos';
    if (supermercadoId) {
        paginaUrl += `?supermercadoId=${supermercadoId}`;
    }

    return {
        produtos: dadosPagina.produtos,
        supermercados,
        supermercadoSelecionado: supermercadoId,
        paginaAtual: pagina,
        totalPaginas: dadosPagina.totalPaginas,
        paginaUrl
    };
};

/**
 * Obtém um produto por ID.
 */
adminService.getProdutoById = async function (id) {
    return Product.findById(id)
        .populate('supermercadoId', 'nome')
        .populate('categoriaId', 'nome');
};

/**
 * Desativa um produto do sistema (Soft Delete).
 */
adminService.eliminarProduto = async function (id) {
    return Product.findByIdAndUpdate(id, { ativo: false });
};

adminService.getSupermercadoById = async function (id) {
    return Supermarket.findById(id);
};

adminService.getCategoriaById = async function (id) {
    return Category.findById(id);
};

adminService.getMercadosAtivos = async function (pagina, limite) {
    const contador = (pagina - 1) * limite;
    const total = await Supermarket.countDocuments({ estadoAprovacao: { $in: ['Aprovado', 'Bloqueado'] } });
    const supermercados = await Supermarket.find({ estadoAprovacao: { $in: ['Aprovado', 'Bloqueado'] } })
        .populate('userId')
        .skip(Number(contador))
        .limit(Number(limite));

    return {
        supermercados,
        paginaAtual: pagina,
        totalPaginas: Math.ceil(total / limite)
    };
};

adminService.getTodosMercadosAtivos = async function () {
    return Supermarket.find({ estadoAprovacao: 'Aprovado' });
};

/**
 * Obtém todas as encomendas do sistema com paginação.
 */
adminService.getEncomendasPaginadas = async function (pagina, limite, supermercadoId = null) {
    const contador = (pagina - 1) * limite;
    const filtro = {};
    if (supermercadoId) {
        filtro.supermercadoId = supermercadoId;
    }

    const total = await Order.countDocuments(filtro);
    const encomendas = await Order.find(filtro)
        .populate('clienteId', 'nome email')
        .populate('supermercadoId', 'nome')
        .sort({ criadoEm: -1 })
        .skip(Number(contador))
        .limit(Number(limite));

    return {
        encomendas,
        totalPaginas: Math.ceil(total / limite) || 1
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
            // Em vez de apagar o supermercado e os produtos, deixamos o supermercado "sem dono"
            // e bloqueado até que um novo administrador seja associado.
            await Supermarket.findOneAndUpdate(
                { userId: id },
                { $set: { userId: null, estadoAprovacao: 'Bloqueado' } },
                { session }
            );
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
    return resultado.map(resultado => ({
        label: meses[resultado._id.mes - 1] + ' ' + resultado._id.ano,
        total: resultado.total
    }));
};


/**
 * Evolução da Faturação por Zona ao longo dos meses
 */
adminService.getFaturacaoPorZona = async function () {
    const anoCurrent = new Date();
    anoCurrent.setMonth(anoCurrent.getMonth() - 12);

    const resultado = await Order.aggregate([
        { $match: { criadoEm: { $gte: anoCurrent } } },
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
        if (!zonasMap[zona]) {
            zonasMap[zona] = {};
        }

        zonasMap[zona][labelText] = r.total;
    });

    const labels = Array.from(labelsSet);

    const datasets = Object.keys(zonasMap).map((zona) => {
        return {
            label: zona,
            data: labels.map(data => zonasMap[zona][data] || 0),
            borderWidth: 2,
            tension: 0.3,
            fill: false
        };
    });

    return { labels, datasets };
};

module.exports = adminService;

