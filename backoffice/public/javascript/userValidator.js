/**
 * Validador Core — Apenas Lógica de Validação
 */
var userValidator = {};

userValidator.rolesPublicas = ['clientes', 'estafetas', 'supermercados'];
userValidator.rolesBackoffice = ['administrador', 'supermercados', 'estafetas'];
userValidator.EMAIL_REGEX = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@"]+\.)+[^<>()[\]\\.,;:\s@"]{2,})$/i;
userValidator.PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

userValidator.validarEmail = function (email) {
    return email && userValidator.EMAIL_REGEX.test(email.trim());
};

userValidator.validarPassword = function (password) {
    return password && userValidator.PASSWORD_REGEX.test(password);
};

userValidator.validarTelefone = function (telefone) {
    return telefone && /^\d{9}$/.test(telefone.toString().trim());
};

userValidator.validarNif = function (nif) {
    return !nif || /^\d{9}$/.test(nif.toString().trim());
};


if (typeof module !== 'undefined' && module.exports) {
    module.exports = userValidator;
} else {
    window.userValidator = userValidator;
}
