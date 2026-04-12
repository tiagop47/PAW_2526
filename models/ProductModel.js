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
        enum: {
            values: ['Frutas', 'Carne', 'Laticinios', 'Bebidas', 'Outros'],
            message: '{VALUE} não é uma categoria válida'
        }
    },
    preco: {
        type: Number,
        required: [true, "O preço é obrigatório"],
        min: [0, "O preço deve ser positivo"]
    },
    precoAntigo: {
        type: Number,
        default: 0,
        min: [0, "O preço antigo deve ser positivo"],
        validate: {
            validator: function (v) {
                return v === 0 || v > this.preco;
            },
            message: "O preço antigo deve ser superior ao preço atual para ser uma promoção válida."
        }
    },
    stockDisponivel: {
        type: Number,
        required: [true, "O stock é obrigatório"],
        min: [0, "O stock deve ser positivo"]
    },
    imagem: {
        type: String,
        required: [true, "A imagem do produto é obrigatória"]
    },
    criadoEm: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', ProductSchema);
