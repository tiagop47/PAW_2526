const Supermarket = require('../models/SupermarketModel');
const User = require('../models/UserModel');
const Order = require('../models/OrderModel');

/**
 * Exibe a Dashboard do Administrador (com dados reais completos).
 */
const exibirDashboard = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const pendentes = await Supermarket.countDocuments({ estadoAprovacao: 'Pendente' });
        const supermercadosAtivosCount = await Supermarket.countDocuments({ estadoAprovacao: 'Aprovado' });
        const totalEncomendas = await Order.countDocuments();

        res.render('admin/dashboard', {
            title: 'Painel Admin',
            totalUsers,
            pendentes,
            supermercadosAtivosCount,
            totalEncomendas
        });
    } catch (err) {
        res.render('admin/dashboard', {
            title: 'Painel Admin',
            totalUsers: 0,
            pendentes: 0,
            supermercadosAtivosCount: 0,
            totalEncomendas: 0
        });
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

/**
 * Lista todos os utilizadores para gestão.
 */
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

/**
 * Exibe formulário de edição de um utilizador.
 */
const editarUser = async (req, res) => {
    try {
        const utilizador = await User.findById(req.params.id).select('-password');
        if (!utilizador) {
            return res.status(404).send('Utilizador não encontrado.');
        }
        res.render('admin/editarUtilizador', {
            title: 'Editar Utilizador',
            utilizador
        });
    } catch (err) {
        res.status(500).send('Erro ao carregar utilizador.');
    }
};

/**
 * Guarda as alterações a um utilizador.
 */
const guardarUser = async (req, res) => {
    try {
        const { nome, email, telefone, morada, role } = req.body;
        await User.findByIdAndUpdate(req.params.id, { nome, email, telefone, morada, role });
        res.redirect('/admin/exibirUtilizadores');
    } catch (err) {
        res.status(500).send('Erro ao guardar utilizador.');
    }
};

/**
 * Elimina um utilizador.
 */
const eliminarUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        // Se tinha supermercado, eliminar também
        await Supermarket.findOneAndDelete({ userId: req.params.id });
        res.redirect('/admin/exibirUtilizadores');
    } catch (err) {
        res.status(500).send('Erro ao eliminar utilizador.');
    }
};

/**
 * Bloqueia um supermercado ativo.
 */
const bloquearSupermercado = async (req, res) => {
    try {
        const supermercado = await Supermarket.findByIdAndUpdate(
            req.params.id,
            { estadoAprovacao: 'Bloqueado' },
            { new: true }
        );

        if (!supermercado) {
            return res.status(404).json({ message: 'Supermercado não encontrado.' });
        }

        res.status(200).json({ message: 'Supermercado bloqueado com sucesso!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao bloquear o supermercado.' });
    }
};

/**
 * API — Lista supermercados ativos (JSON).
 */
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
    guardarUser,
    eliminarUser,
    bloquearSupermercado,
    supermercadosAtivos
};
