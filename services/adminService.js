const Supermarket = require('../models/SupermarketModel');
const User = require('../models/UserModel');

const getDashboardStats = async () => {
    const totalUsers = await User.countDocuments();
    const pendentes = await Supermarket.countDocuments({ estadoAprovacao: 'Pendente' });

    return {
        totalUsers,
        pendentes
    };
};

const getPendentesDocumentos = async (pagina, limite) => {
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

const aprovarSupermercadoById = async (id) => {
    return Supermarket.findByIdAndUpdate(id, { estadoAprovacao: 'Aprovado' });
};

const rejeitarSupermercadoById = async (id) => {
    return Supermarket.findByIdAndUpdate(id, { estadoAprovacao: 'Rejeitado' });
};

const getUsersDocumentos = async (pagina, limite) => {
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

const getEstafetasDocumentos = async (pagina, limite) => {
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

const getUserByIdSemPassword = async (id) => {
    return User.findById(id).select('-password');
};

const atualizarUserById = async (id, dados) => {
    return User.findByIdAndUpdate(id, dados);
};

const getMercadosAtivos = async (contador, limite) => {
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

const bloquearSupermercadoById = async (id) => {
    return Supermarket.findByIdAndUpdate(id, { estadoAprovacao: 'Bloqueado' });
};

module.exports = {
    getDashboardStats,
    getPendentesDocumentos,
    aprovarSupermercadoById,
    rejeitarSupermercadoById,
    getUserByIdSemPassword,
    atualizarUserById,
    getMercadosAtivos,
    bloquearSupermercadoById,
    getUsersDocumentos,
    getEstafetasDocumentos
};
