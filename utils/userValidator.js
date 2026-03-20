/**
 * Utilitário de Validação
 * Apenas validações que requerem lógica custom (regex, regras compostas).
 * Validações simples (minlength, maxlength, min) estão nos Schemas do Mongoose.
 */

const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@"]+\.)+[^<>()[\]\\.,;:\s@"]{2,})$/i;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const rolesPublicas = ['clientes', 'supermercados', 'estafetas'];

function validarEmail(email) {
    return email && emailRegex.test(email);
}

function validarPassword(password) {
    return password && passwordRegex.test(password);
}

function validarTelefone(telefone) {
    return telefone && telefone.toString().trim().length >= 9;
}

function validarRegisto(dados) {
    const { nome, email, password, morada, telefone, role } = dados;

    if (!nome || nome.trim().length < 3) {
        return "O nome deve ter pelo menos 3 caracteres.";
    }
    if (!validarEmail(email)) {
        return "Formato de email inválido.";
    }
    if (!validarPassword(password)) {
        return "A password deve ter pelo menos 8 caracteres (Incluindo Maiúscula, Minúscula e Número).";
    }
    if (!morada || morada.trim().length < 5) {
        return "Morada inválida.";
    }
    if (!validarTelefone(telefone)) {
        return "Telefone inválido (mín. 9 dígitos).";
    }

    if (role && !rolesPublicas.includes(role)) {
        return "Perfil de utilizador inválido.";
    }

    return null;
}

module.exports = {
    validarEmail,
    validarPassword,
    validarTelefone,
    validarRegisto,
    rolesPublicas
};
