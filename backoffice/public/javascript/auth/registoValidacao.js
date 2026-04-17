/**
 * Validação de Registo Simplificada (com alert)
 */
const formRegistar = document.querySelector('form[action="/auth/registar"]');
const campoNome = document.getElementById('nome');
const campoEmail = document.getElementById('email');
const campoPass = document.getElementById('password');
const campoNif = document.getElementById('nif');
const campoTel = document.getElementById('telefone');

function validarRegisto(e) {
    const validator = window.userValidator;

    if (campoNome && campoNome.value.trim().length < 3) {
        alert('O nome deve ter pelo menos 3 caracteres.');
        e.preventDefault();
        return;
    }

    if (campoEmail && !validator.validarEmail(campoEmail.value)) {
        alert('Por favor, introduza um email válido.');
        e.preventDefault();
        return;
    }

    if (campoPass && !validator.validarPassword(campoPass.value)) {
        alert('A password deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula, uma minúscula e um número.');
        e.preventDefault();
        return;
    }

    if (campoNif && !validator.validarNif(campoNif.value)) {
        alert('O NIF deve ter exatamente 9 dígitos numéricos.');
        e.preventDefault();
        return;
    }

    if (campoTel && !validator.validarTelefone(campoTel.value)) {
        alert('Por favor, introduza um número de telefone válido.');
        e.preventDefault();
        return;
    }
}

if (formRegistar) {
    formRegistar.addEventListener('submit', validarRegisto);
}
