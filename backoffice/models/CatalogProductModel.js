const mongoose = require('mongoose');

const CatalogProductSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, "O nome do produto é obrigatório"],
        unique: true,
        trim: true,
        minlength: [2, "Nome do produto demasiado curto"],
        maxlength: [100, "Nome do produto demasiado longo"]
    },
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
        validate: {
            validator: function(v) {
                return !v || /^\d{12,13}$/.test(v);
            },
            message: "O código de barras deve conter 12 ou 13 dígitos numéricos."
        }
    },
    descricao: String,
    criadoEm: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CatalogProduct', CatalogProductSchema);
