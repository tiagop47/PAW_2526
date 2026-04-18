const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
    codigo: {
        type: String,
        required: [true, 'O código do cupão é obrigatório'],
        unique: true,
        uppercase: true,
        trim: true
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
    ativo: {
        type: Boolean,
        default: true
    },
    criadoEm: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Coupon', CouponSchema);
