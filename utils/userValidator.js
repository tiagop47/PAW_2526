/**
 * Utilitário de Validação
 * Apenas validações que requerem lógica custom (regex, regras compostas).
 * Validações simples (minlength, maxlength, min) estão nos Schemas do Mongoose.
 */

const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@"]+\.)+[^<>()[\]\\.,;:\s@"]{2,})$/i;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const rolesPublicas = ['supermercados', 'estafetas'];

function validarEmail(email) {
    return email && emailRegex.test(email);
}

function validarPassword(password) {
    return password && passwordRegex.test(password);
}

function validarTelefone(telefone) {
    return telefone && telefone.toString().trim().length >= 9;
}

module.exports = {
    validarEmail,
    validarPassword,
    validarTelefone,
    rolesPublicas
};
