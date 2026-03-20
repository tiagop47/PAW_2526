const mongoose = require('mongoose');
const { validarNome, validarEmail, validarPassword, validarTelefone, validarMorada } = require('../utils/userValidator');

const UserSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, "O nome é obrigatório"],
        validate: {
            validator: validarNome,
            message: "O nome deve ter pelo menos 3 caracteres"
        }
    },
    email: {
        type: String,
        required: [true, "O email é obrigatório"],
        unique: true,
        validate: {
            validator: validarEmail,
            message: "Formato de email inválido"
        }
    },
    password: {
        type: String,
        required: [true, "A password é obrigatória"],
        validate: {
            validator: validarPassword,
            message: "A password deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula, uma minúscula e um número"
        }
    },
    telefone: {
        type: String,
        required: [true, "O telefone é obrigatório"],
        validate: {
            validator: validarTelefone,
            message: "Por favor, introduza um número de telefone válido (pelo menos 9 dígitos)"
        }
    },
    morada: {
        type: String,
        required: [true, "A morada é obrigatória"],
        validate: {
            validator: validarMorada,
            message: "Por favor, introduza uma morada válida"
        }
    },
    role: {
        type: String,
        enum: ['clientes', 'supermercados', 'estafetas', 'administradores'],
        default: 'clientes',
        required: true
    },
    criadoEm: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);