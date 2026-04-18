const mongoose = require('mongoose');
const User = require('./UserModel');

const AvaliacaoSchema = new mongoose.Schema({
    encomendaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        unique: true
    },
    clienteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        validate: {
            validator: async function (id) {
                const user = await User.findById(id).select('role').lean();
                return user?.role === 'clientes';
            },
            message: 'O clienteId deve pertencer a um utilizador com role "clientes".'
        }
    },
    supermercadoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supermarket',
        required: true
    },
    estafetaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    notaSupermercado: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    notaEstafeta: {
        type: Number,
        min: 1,
        max: 5,
        default: null
    },
    comentario: {
        type: String,
        maxlength: 500,
        default: ''
    },
    criadoEm: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Avaliacao', AvaliacaoSchema);
