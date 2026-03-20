const mongoose = require('mongoose');
const { validarNomeProduto, validarPreco, validarStock, validarCategoria } = require('../utils/userValidator');

const ProductSchema = new mongoose.Schema({
    supermercadoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supermarket', required: true },
    nome: { 
        type: String, 
        required: [true, "O nome do produto é obrigatório"],
        validate: { validator: validarNomeProduto, message: "Nome do produto inválido" }
    },
    descricao: String,
    categoria: { 
        type: String, 
        required: [true, "A categoria é obrigatória"],
        validate: { validator: validarCategoria, message: "Categoria inválida" }
    },
    preco: { 
        type: Number, 
        required: [true, "O preço é obrigatório"],
        validate: { validator: validarPreco, message: "O preço deve ser positivo" }
    },
    stockDisponivel: { 
        type: Number, 
        required: [true, "O stock é obrigatório"],
        validate: { validator: validarStock, message: "O stock deve ser um número inteiro positivo" }
    },
    imagem: String,
    criadoEm: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', ProductSchema);