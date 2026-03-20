const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    supermercadoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supermarket', required: true },
    nome: {
        type: String,
        required: [true, "O nome do produto é obrigatório"],
        minlength: [2, "Nome do produto demasiado curto"],
        maxlength: [100, "Nome do produto demasiado longo"]
    },
    descricao: String,
    categoria: {
        type: String,
        required: [true, "A categoria é obrigatória"],
        minlength: [3, "Categoria inválida"],
        maxlength: [30, "Categoria demasiado longa"]
    },
    preco: {
        type: Number,
        required: [true, "O preço é obrigatório"],
        min: [0, "O preço deve ser positivo"]
    },
    stockDisponivel: {
        type: Number,
        required: [true, "O stock é obrigatório"],
        min: [0, "O stock deve ser positivo"]
    },
    imagem: String,
    criadoEm: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', ProductSchema);