const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
    codigo: {
        type: String,
        required: [true, 'O código do cupão é obrigatório'],
        unique: true,
        uppercase: true,
        trim: true
    },
    tipoDesconto: {
        type: String,
        enum: ['percentagem', 'valor'],
        default: 'percentagem'
    },
    percentagemDesconto: {
        type: Number,
        required: function () {
            return this.tipoDesconto !== 'valor';
        },
        min: [1, 'A percentagem mínima é 1%'],
        max: [100, 'A percentagem máxima é 100%']
    },
    valorDesconto: {
        type: Number,
        required: function () {
            return this.tipoDesconto === 'valor';
        },
        min: [0.01, 'O valor mínimo é 0.01€']
    },
    origem: {
        type: String,
        enum: ['supermercado', 'boas_vindas', 'fidelidade'],
        default: 'supermercado'
    },
    clienteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    supermercadoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supermarket'
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
