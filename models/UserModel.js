const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { validarNome, validarEmail, validarPassword } = require('../utils/userValidator');

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
    criadoEm: { type: Date, default: Date.now }
});

UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;

    try {
        const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;
        const salt = await bcrypt.genSalt(saltRounds);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
        throw err;
    }
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
