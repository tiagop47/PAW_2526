// Seletores de Elementos (Topo)
var formLogin = document.querySelector('form[action="/auth/login"]');
var campoEmail = document.getElementById('emailInput');
var campoPass = document.getElementById('password');

function validarLogin(e) {
    var temErro = false;

    if (!userValidator.validarEmail(campoEmail.value)) {
        userValidator.exibirErro(campoEmail, 'Email inválido.');
        temErro = true;
    }
    if (campoPass.value.length < 1) {
        userValidator.exibirErro(campoPass, 'Password obrigatória.');
        temErro = true;
    }

    if (temErro) {
        e.preventDefault();
    }
}

formLogin.addEventListener('submit', validarLogin);
