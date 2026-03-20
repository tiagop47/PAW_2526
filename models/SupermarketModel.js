const mongoose = require('mongoose');
const { validarNomeSupermercado, validarLocalizacao, validarDescricao } = require('../utils/userValidator');

const SupermarketSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    nome: { 
        type: String, 
        required: [true, "O nome é obrigatório"],
        validate: { validator: validarNomeSupermercado, message: "Nome inválido (mín. 3 caracteres)" }
    },
    descricao: { 
        type: String,
        validate: { validator: validarDescricao, message: "A descrição é demasiado longa" }
    },
    localizacao: { 
        type: String, 
        required: [true, "A localização é obrigatória"],
        validate: { validator: validarLocalizacao, message: "Localização curta demais" }
    },
    horarioFuncionamento: String,
    metodosEntrega: { type: [String], default: ['levantamento em loja'] },
    custoEntrega: { type: Number, default: 0 },
    estadoAprovacao: { 
        type: String, 
        enum: ['Pendente', 'Aprovado', 'Rejeitado'], 
        default: 'Pendente' 
    },
    criadoEm: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Supermarket', SupermarketSchema);