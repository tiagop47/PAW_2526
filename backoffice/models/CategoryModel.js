const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, "O nome da categoria é obrigatório"],
        unique: true,
        trim: true,
        minlength: [2, "O nome é demasiado curto"]
    },
    descricao: String,
    criadoEm: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Category', CategorySchema);
