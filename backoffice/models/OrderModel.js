const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
    produtoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantidade: { type: Number, required: true, min: [1, 'A quantidade mínima é 1'] },
    precoUnitario: { type: Number, required: true, min: [0, 'O preço unitário não pode ser negativo'] },
    ivaTaxa: { type: Number, default: 23 }
},
    { _id: false });

const OrderSchema = new mongoose.Schema({
    supermercadoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supermarket', required: true },
    clienteId: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    },
    estafetaId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    produtos: {
        type: [OrderItemSchema],
        validate: [function (arr) { return arr.length > 0; }, 'A encomenda deve ter pelo menos um produto']
    },
    valorProdutos: { type: Number, default: 0 },
    valorTotal: { type: Number, required: true, min: [0, 'O valor total não pode ser negativo'] },
    valorTotalIVA: { type: Number, default: 0 },
    taxaEntrega: { type: Number, default: 0 },
    metodoPagamento: {
        type: String,
        enum: ['dinheiro', 'cartao', 'mbway', 'online'],
        default: 'online'
    },
    cupaoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
    descontoValor: { type: Number, default: 0 },
    estado: {
        type: String,
        enum: ['pendente', 'confirmada', 'em_preparacao', 'em_entrega', 'aguarda_validacao', 'entregue', 'cancelada'],
        default: 'pendente'
    },
    origem: {
        type: String,
        enum: ['online', 'caixa'],
        default: 'online'
    },
    metodoEntrega: {
        type: String,
        enum: ['levantamento_loja', 'entrega_domicilio'],
        default: 'levantamento_loja'
    },
    moradaEntrega: {
        type: String,
        required: function () {
            return this.metodoEntrega === 'entrega_domicilio';
        }
    },
    coordenadasEntrega: {
        lat: { type: Number, min: [-90, 'Latitude inválida'], max: [90, 'Latitude inválida'] },
        lng: { type: Number, min: [-180, 'Longitude inválida'], max: [180, 'Longitude inválida'] }
    },
    faturaNumero: { type: String },
    faturaData: { type: Date },
    clienteSnapshot: {
        nome: { type: String },
        nif: { type: String },
        morada: { type: String },
        email: { type: String },
        telefone: { type: String }
    },
    confirmadaEm: { type: Date },
    criadoEm: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);