const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
    produtoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantidade: { type: Number, required: true, min: 1 },
    precoUnitario: { type: Number, required: true }
},
    { _id: false });

const OrderSchema = new mongoose.Schema({
    supermercadoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supermarket', required: true },
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    estafetaId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    produtos: [OrderItemSchema],
    valorTotal: { type: Number, required: true },
    estado: {
        type: String,
        enum: ['pendente', 'confirmada', 'em entrega', 'cancelada'],
        default: 'pendente'
    },
    metodoEntrega: {
        type: String,
        default: 'levantamento em loja'
    },
    criadoEm: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);