
/**
 * Validação de Login Simplificada (com alert)
 */

const formLogin = document.querySelector('form[action="/auth/login"]');
const campoEmail = document.getElementById('emailInput');
const campoPass = document.getElementById('password');

function validarLogin(e) {
    const validator = window.userValidator;

    if (campoEmail && !validator.validarEmail(campoEmail.value)) {
        alert('Por favor, introduza um email válido.');
        e.preventDefault();
        return;
    }

    if (campoPass && campoPass.value.length < 1) {
        alert('Por favor, introduza a sua password.');
        e.preventDefault();
        return;
    }
}

if (formLogin) {
    formLogin.addEventListener('submit', validarLogin);
}
