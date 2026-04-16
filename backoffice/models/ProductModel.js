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
    categoriaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, "A categoria é obrigatória"]
    },
    codigoBarras: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        minlength: [9, "O código de barras deve ter pelo menos 9 caracteres"]
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
                let precoAtual = this.preco;
                if (precoAtual === undefined && typeof this.get === 'function') {
                    precoAtual = this.get('preco');
                }
                return v === 0 || v > precoAtual;
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
