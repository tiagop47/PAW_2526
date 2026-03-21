const Supermarket = require('../models/SupermarketModel');
const User = require('../models/UserModel');

/**
 * Exibe a Dashboard do Administrador.
 */
const exibirDashboard = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const pendentes = await Supermarket.countDocuments({ estadoAprovacao: 'Pendente' });
        res.render('admin/dashboard', { title: 'Painel Admin', totalUsers, pendentes });
    } catch (err) {
        res.render('admin/dashboard', { title: 'Painel Admin', totalUsers: 0, pendentes: 0 });
    }
};

/**
 * Lista todos os supermercados que aguardam aprovação.
 */
const listarPendentes = async (req, res) => {
    try {
        const supermercados = await Supermarket.find({ estadoAprovacao: 'Pendente' }).populate('userId');
        res.render('admin/supermercadosPendentes', { title: 'Aprovações Pendentes', supermercados });
    } catch (err) {
        res.status(500).send('Erro ao carregar lista de pendentes.');
    }
};

/**
 * Aprova um supermercado.
 */
const aprovarSupermercado = async (req, res) => {
    try {
        await Supermarket.findByIdAndUpdate(req.params.id, { estadoAprovacao: 'Aprovado' });
        res.redirect('/admin/supermercados/pendentes');
    } catch (err) {
        res.status(500).send('Erro ao aprovar supermercado.');
    }
};

/**
 * Rejeita um supermercado.
 */
const rejeitarSupermercado = async (req, res) => {
    try {
        await Supermarket.findByIdAndUpdate(req.params.id, { estadoAprovacao: 'Rejeitado' });
        res.redirect('/admin/supermercados/pendentes');
    } catch (err) {
        res.status(500).send('Erro ao rejeitar supermercado.');
    }
};

module.exports = {
    exibirDashboard,
    listarPendentes,
    aprovarSupermercado,
    rejeitarSupermercado
};