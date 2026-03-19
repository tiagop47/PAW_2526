/**
 * Utilitário para validação de dados de utilizador no backend.
 */

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const validarNome = (nome) => {
    return nome && nome.trim().length >= 3;
};

const validarEmail = (email) => {
    return email && emailRegex.test(email);
};

const validarPassword = (password) => {
    return password && passwordRegex.test(password);
};

/**
 * Valida os dados de registo de um utilizador de forma agrupada.
 * Utilizado principalmente nas rotas para feedback rápido.
 */
function validarRegisto(nome, email, password) {
    if (!validarNome(nome)) {
        return "O nome deve ter pelo menos 3 caracteres.";
    }
    if (!validarEmail(email)) {
        return "Por favor, introduza um email válido.";
    }
    if (!validarPassword(password)) {
        return "A password deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula, uma minúscula e um número.";
    }
    return null;
}

module.exports = {
    validarNome,
    validarEmail,
    validarPassword,
    validarRegisto
};
