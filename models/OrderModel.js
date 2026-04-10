const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
    produtoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantidade: { type: Number, required: true, min: 1 },
    precoUnitario: { type: Number, required: true }
},
    { _id: false });

const OrderSchema = new mongoose.Schema({
    supermercadoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supermarket', required: true },
    clienteId: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    },
    estafetaId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    produtos: [OrderItemSchema],
    valorTotal: { type: Number, required: true },
    estado: {
        type: String,
        enum: ['pendente', 'confirmada', 'em preparação', 'entrega', 'entregue', 'cancelada'],
        default: 'pendente'
    },
    metodoEntrega: {
        type: String,
        enum: ['levantamento em loja', 'entrega ao domicilio'],
        default: 'levantamento em loja'
    },
    moradaEntrega: {
        type: String,
        required: function () {
            return this.metodoEntrega === 'entrega ao domicilio';
        }
    },
    coordenadasEntrega: {
        lat: { type: Number },
        lng: { type: Number }
    },
    criadoEm: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);