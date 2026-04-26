const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { validarEmail, validarPassword, validarTelefone, validarNif } = require('../public/javascript/userValidator');
const config = require('../config/config');

const baseOptions = {
    discriminatorKey: 'role', // O campo 'role' determinará o tipo de utilizador
    collection: 'users',      // Todos partilham a mesma coleção 'users'
};

const UserSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, "O nome é obrigatório"],
        minlength: [3, "O nome deve ter pelo menos 3 caracteres"]
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
        minlength: [9, "O telefone deve ter exatamente 9 dígitos"],
        maxlength: [9, "O telefone deve ter exatamente 9 dígitos"],
        validate: {
            validator: validarTelefone,
            message: "Por favor, introduza um número de telefone válido"
        }
    },
    nif: {
        type: String,
        sparse: true,
        unique: true,
        validate: {
            validator: validarNif,
            message: "O NIF deve ter exatamente 9 dígitos"
        }
    },
    morada: {
        type: String,
        required: [true, "A morada é obrigatória"],
        minlength: [5, "Por favor, introduza uma morada válida"]
    },
    role: {
        type: String,
        enum: ['clientes', 'supermercados', 'estafetas', 'administrador'],
        default: 'clientes',
        required: true
    },
    criadoEm: { type: Date, default: Date.now },

    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    },
    bloqueado: {
        type: Boolean,
        default: false
    }
}, baseOptions);

UserSchema.pre('save', async function () {
    if (this.nif === "" || this.nif === null) {
        this.nif = undefined;
    }

    if (!this.isModified('password')) {
        return;
    }

    this.password = await bcrypt.hash(this.password, config.SALT_ROUNDS);
});

// Middleware para transformar erros de duplicidade (E11000) em mensagens amigáveis
UserSchema.post('save', function (error, doc, next) {
    if (error.name === 'MongoServerError' && error.code === 11000) {
        if (error.keyPattern && error.keyPattern.email) {
            next(new Error('Já existe uma conta registada com este endereço de email.'));
        } else if (error.keyPattern && error.keyPattern.nif) {
            next(new Error('Já existe uma conta registada com este NIF.'));
        } else {
            next(new Error('Erro de duplicidade: Alguns dados já estão em uso no sistema.'));
        }
    } else {
        next(error);
    }
});

const User = mongoose.model('User', UserSchema);

const Cliente = User.discriminator('clientes', new mongoose.Schema({
    cupoes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon'
    }],
    supermercadoFavorito: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supermarket'
    }
}));

module.exports = User;
module.exports.Cliente = Cliente;
