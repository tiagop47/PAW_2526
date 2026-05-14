const mongoose = require('mongoose');

const ReclamacaoSchema = new mongoose.Schema({
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    supermercadoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supermarket' },
    encomendaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    categoria: {
        type: String,
        enum: ['produto', 'entrega', 'pagamento', 'atendimento', 'outro'],
        default: 'outro'
    },
    assunto: {
        type: String,
        required: [true, 'O assunto é obrigatório'],
        minlength: [3, 'O assunto deve ter pelo menos 3 caracteres']
    },
    descricao: {
        type: String,
        required: [true, 'A descrição é obrigatória'],
        minlength: [10, 'A descrição deve ter pelo menos 10 caracteres']
    },
    estado: {
        type: String,
        enum: ['pendente', 'em_analise', 'resolvida'],
        default: 'pendente'
    },
    respostaSupermercado: { type: String },
    respostaAdmin: { type: String },
    criadoEm: { type: Date, default: Date.now },
    atualizadoEm: { type: Date, default: Date.now }
});

ReclamacaoSchema.pre('save', function () {
    this.atualizadoEm = new Date();
});

module.exports = mongoose.model('Reclamacao', ReclamacaoSchema);
