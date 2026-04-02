const Supermarket = require('../models/SupermarketModel');
const User = require('../models/UserModel');
const Product = require('../models/ProductModel');
const Order = require('../models/OrderModel');

const adminService = {};

adminService.getDashboardStats = async function () {
    const [totalUsers, totalEstafetas, pendentes, ativos, totalProdutos, totalEncomendas] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'estafetas' }),
        Supermarket.countDocuments({ estadoAprovacao: 'Pendente' }),
        Supermarket.countDocuments({ estadoAprovacao: 'Aprovado' }),
        Product.countDocuments(),
        Order.countDocuments()
    ]);

    return {
        totalUsers,
        totalEstafetas,
        pendentes,
        ativos,
        totalProdutos,
        totalEncomendas
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
    const total = await Supermarket.countDocuments({ estadoAprovacao: 'Aprovado' });
    const supermercados = await Supermarket.find({ estadoAprovacao: 'Aprovado' })
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

module.exports = adminService;
