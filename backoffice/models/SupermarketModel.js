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
        required: [true, "Localização é obrigatória"],
    },
    localizacaoGeo: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: [true, "As coordenadas são obrigatórias"]
        }
    },
    horarioFuncionamento: String,
    custoEntregaPorMetodo: {
        levantamento_loja: { type: Number, default: 0 },
        entrega_domicilio: { type: Number, min: [0, "O custo não pode ser negativo"] }
    },
    estadoAprovacao: {
        type: String,
        enum: ['Pendente', 'Aprovado', 'Rejeitado', 'Bloqueado'],
        default: 'Pendente'
    },
    criadoEm: { type: Date, default: Date.now }
});

SupermarketSchema.index({ localizacaoGeo: '2dsphere' });

module.exports = mongoose.model('Supermarket', SupermarketSchema);