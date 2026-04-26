const { Cliente } = require('../../models/UserModel');

const userApiController = {};

userApiController.atualizarPerfil = async function (req, res) {
    try {
        const { id } = req.params;

        if (req.user.id !== id) {
            return res.status(403).json({ sucesso: false, erro: 'Sem permissão para editar este perfil.' });
        }

        const camposPermitidos = ['nome', 'telefone', 'nif', 'morada', 'supermercadoFavorito'];
        const updates = {};
        for (const campo of camposPermitidos) {
            if (req.body[campo] !== undefined) {
                updates[campo] = req.body[campo];
            }
        }

        const user = await Cliente.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
        if (!user) {
            return res.status(404).json({ sucesso: false, erro: 'Utilizador não encontrado.' });
        }

        const userObj = user.toObject();
        delete userObj.password;

        res.json({ sucesso: true, user: userObj });
    } catch (err) {
        res.status(400).json({ sucesso: false, erro: err.message });
    }

};

module.exports = userApiController;
