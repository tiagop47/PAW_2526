const Supermarket = require('../models/SupermarketModel');
const User = require('../models/UserModel');
const Product = require('../models/ProductModel');
const Order = require('../models/OrderModel');
const Category = require('../models/CategoryModel');

const adminService = {};

/**
 * Gestão de Categorias
 */

adminService.listarCategorias = async function () {
    return Category.find().sort({ nome: 1 });
};

adminService.criarCategoria = async function (dados) {
    return Category.create(dados);
};

adminService.eliminarCategoria = async function (id) {
    // Verificar se existem produtos que usam esta categoria
    const produtosUsam = await Product.countDocuments({ categoriaId: id });
    if (produtosUsam > 0) {
        throw new Error('Não é possível eliminar: existem produtos nesta categoria.');
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

adminService.alternarBloqueio = async function (id){
    const loja = await Supermarket.findById(id)
  
    let estadoSeguinte = 'Bloqueado'; 

    if(loja.estadoAprovacao === 'Bloqueado') {
         estadoSeguinte = 'Aprovado';
    }

    return Supermarket.findByIdAndUpdate(id, { estadoAprovacao: estadoSeguinte });
}

adminService.getUsersDocumentos = async function (pagina, limite) {
    const contador = (pagina - 1) * limite;

    const total = await User.countDocuments();
    const users = await User.find()
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

module.exports = adminService;
