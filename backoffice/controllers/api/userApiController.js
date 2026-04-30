const { Cliente } = require('../../models/UserModel');
const orderService = require('../../services/orderService');

const userApiController = {};

userApiController.obterEstatisticas = async function (req, res) {
    try {
        const clienteId = req.user.id;
        const stats = await orderService.obterEstatisticasCliente(clienteId);
        res.json({ sucesso: true, stats });
    } catch (err) {
        res.status(500).json({ sucesso: false, erro: err.message });
    }
};

userApiController.atualizarPerfil = async function (req, res) {
    try {
        if (req.userPerfil !== req.userPerfil._id.toString()) {
            return res.status(403).json({ sucesso: false, erro: 'Sem permissão para editar este perfil.' });
        }

        const camposPermitidos = ['nome', 'telefone', 'nif', 'morada', 'supermercadoFavorito'];
        const updates = {};
        for (const campo of camposPermitidos) {
            if (req.body[campo] !== undefined) {
                updates[campo] = req.body[campo];
            }
        }

        // Atualizar usando o documento já carregado
        Object.assign(req.userPerfil, updates);
        const user = await req.userPerfil.save();

        const userObj = user.toObject();
        delete userObj.password;

        res.json({ sucesso: true, user: userObj });
    } catch (err) {
        res.status(400).json({ sucesso: false, erro: err.message });
    }

};
userApiController.meusCupoes = async function (req, res) {
    try {
        const cliente = await Cliente.findById(req.user.id)
            .populate({
                path: 'cupoes',
                populate: { path: 'supermercadoId', select: 'nome' }
            });

        if (!cliente) {
            return res.status(404).json({ sucesso: false, erro: 'Cliente não encontrado.' });
        }

        const agora = new Date();
        const cupoes = (cliente.cupoes || []).map(c => ({
            _id: c._id,
            codigo: c.codigo,
            percentagemDesconto: c.percentagemDesconto,
            supermercadoId: c.supermercadoId?._id?.toString() || null,
            supermercado: c.supermercadoId?.nome || null,
            prazo: c.prazo,
            ativo: c.ativo,
            expirado: c.prazo < agora
        }));

        res.json({ sucesso: true, cupoes });
    } catch (err) {
        res.status(500).json({ sucesso: false, erro: err.message });
    }
};

module.exports = userApiController;
