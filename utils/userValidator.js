/**
 * Utilitário para validação de dados de utilizador no backend.
 */

const emailRegex = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
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

const validarTelefone = (telefone) => {
    return telefone && telefone.toString().trim().length >= 9;
};

const validarMorada = (morada) => {
    return morada && morada.trim().length >= 5;
};

/**
 * Valida os dados de registo de um utilizador de forma agrupada.
 * Utilizado principalmente nas rotas para feedback rápido.
 */
function validarRegisto(nome, email, password, morada, telefone, role) {
    if (!validarNome(nome)) {
        return "O nome deve ter pelo menos 3 caracteres.";
    }
    if (!validarEmail(email)) {
        return "Por favor, introduza um email válido.";
    }
    if (!validarPassword(password)) {
        return "A password deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula, uma minúscula e um número.";
    }
    if (!validarMorada(morada)) {
        return "Por favor, introduza uma morada válida.";
    }
    if (!validarTelefone(telefone)) {
        return "Por favor, introduza um número de telefone válido (pelo menos 9 dígitos).";
    }
    const rolesPermitidas = ['cliente', 'supermercado', 'estafeta', 'admin'];
    if (role && !rolesPermitidas.includes(role)) {
        return "O perfil de utilizador selecionado é inválido.";
    }
    return null;
}

module.exports = {
    validarNome,
    validarEmail,
    validarPassword,
    validarTelefone,
    validarMorada,
    validarRegisto
};
