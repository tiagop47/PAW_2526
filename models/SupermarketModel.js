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
        default: "Definido por Coordenadas"
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
    metodosEntrega: { type: [String], default: ['levantamento em loja'] },
    custoEntrega: { type: Number, default: 0 },
    raioAtuacao: {
        type: Number,
        default: 5, // Raio padrão de 5km para o "círculo"
        min: [1, "O raio mínimo é 1km"],
        max: [50, "O raio máximo é 50km"]
    },
    estadoAprovacao: {
        type: String,
        enum: ['Pendente', 'Aprovado', 'Rejeitado'],
        default: 'Pendente'
    },
    criadoEm: { type: Date, default: Date.now }
});

SupermarketSchema.index({ localizacaoGeo: '2dsphere' });

module.exports = mongoose.model('Supermarket', SupermarketSchema);