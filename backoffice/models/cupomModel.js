const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
    codigo: {
        type: String,
        required: [true, 'O código do cupão é obrigatório'],
        unique: true,
        uppercase: true,
        trim: true
    },
    clienteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Opcional: Se preenchido, só este cliente poderá resgatar
        required: false
    },
    percentagemDesconto: {
        type: Number,
        required: [true, 'A percentagem de desconto é obrigatória'],
        min: [1, 'A percentagem mínima é 1%'],
        max: [100, 'A percentagem máxima é 100%']
    },
    prazo: {
        type: Date,
        required: [true, 'O prazo de validade é obrigatório']
    },
    limiteUtilizacoes: {
        type: Number,
        required: [true, 'O limite de utilizações é obrigatório'],
        min: [1, 'O limite deve ser pelo menos 1']
    },
    utilizacoesAtuais: {
        type: Number,
        default: 0
    },
    criadoEm: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Coupon', CouponSchema);
