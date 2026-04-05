/**
 * Validador Core — Partilhado entre Backend (Node) e Frontend (Browser)
 */
var userValidator = {};

userValidator.EMAIL_REGEX = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@"]+\.)+[^<>()[\]\\.,;:\s@"]{2,})$/i;
userValidator.PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
userValidator.rolesPublicas = ['clientes', 'supermercados', 'estafetas'];

userValidator.validarEmail = function (email) {
    return email && userValidator.EMAIL_REGEX.test(email);
};

userValidator.validarPassword = function (password) {
    return password && userValidator.PASSWORD_REGEX.test(password);
};

userValidator.validarTelefone = function (telefone) {
    return telefone && telefone.toString().trim().length >= 9;
};


userValidator.exibirErro = function (campo, mensagem) {
    campo.classList.add('is-invalid');
    campo.parentNode.querySelector('.invalid-feedback').textContent = mensagem;
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = userValidator;
} else {
    window.userValidator = userValidator;
}
