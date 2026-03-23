const mongoose = require('mongoose');

const SupermarketSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    nome: {
        type: String,
        required: [true, "O nome é obrigatório"],
        minlength: [3, "Nome inválido (mín. 3 caracteres)"],
        maxlength: [50, "Nome demasiado longo (máx. 50 caracteres)"]
    },
    descricao: {
        type: String,
        maxlength: [500, "A descrição é demasiado longa"]
    },
    localizacao: {
        type: String,
        required: [true, "A localização é obrigatória"],
        minlength: [5, "Localização curta demais"],
        maxlength: [100, "Localização demasiado longa"]
    },
    horarioFuncionamento: String,
    metodosEntrega: { type: [String], default: ['levantamento em loja'] },
    custoEntrega: { type: Number, default: 0 },
    estadoAprovacao: {
        type: String,
        enum: ['Pendente', 'Aprovado', 'Rejeitado', 'Bloqueado'],
        default: 'Pendente'
    },
    criadoEm: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Supermarket', SupermarketSchema);