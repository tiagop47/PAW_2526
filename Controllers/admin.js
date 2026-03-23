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
        res.redirect('/admin/pendentes');
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
        res.redirect('/admin/pendentes');
    } catch (err) {
        res.status(500).send('Erro ao rejeitar supermercado.');
    }
};

const listarUtilizadores = async (req, res) => {
    try {
        const users = await User.find().sort({ criadoEm: -1 });
        res.render('admin/exibirUtilizadores', {
            title: 'Gestão de Utilizadores',
            users
        });
    } catch (err) {
        res.status(500).send('Erro ao carregar lista de utilizadores.');
    }
};

const editarUser = async (req, res) => {
    try {

    } catch (err) {
        res.status(500).send('Erro ao rejeitar supermercado.');
    }
};

/**
 * Bloqueia um supermercado ativo.
 */
const bloquearSupermercado = async (req, res) => {
    try {
        const id = req.params.id;
        const supermercado = await Supermarket.findByIdAndUpdate(id, { estadoAprovacao: 'Bloqueado' }, { new: true });
        
        if (!supermercado) {
            return res.status(404).json({ message: 'Supermercado não encontrado.' });
        }

        res.status(200).json({ message: 'Supermercado bloqueado com sucesso!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao bloquear o supermercado.' });
    }
};

const supermercadosAtivos = async (req, res) => {
    try {
        const limite = parseInt(req.query.limite) || 5;
        const pular = parseInt(req.query.pular) || 0;

        const supermercados = await Supermarket.find({ estadoAprovacao: 'Aprovado' })
            .populate('userId')
            .skip(pular)
            .limit(limite);

        res.json(supermercados);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao listar supermercados ativos.' });
    }
};

module.exports = {
    exibirDashboard,
    listarPendentes,
    aprovarSupermercado,
    rejeitarSupermercado,
    listarUtilizadores,
    editarUser,
    bloquearSupermercado,
    supermercadosAtivos
};
