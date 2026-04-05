// Seletores de Elementos (Topo)
const formRegistar = document.querySelector('form[action="/auth/registar"]');
const campoNome = document.getElementById('nome');
const campoEmail = document.getElementById('email');
const campoPass = document.getElementById('password');
const campoNif = document.getElementById('nif');
const campoTel = document.getElementById('telefone');

function validarRegisto(e) {
    var temErro = false;

    if (campoNome.value.trim().length < 3) {
        userValidator.exibirErro(campoNome, 'Mínimo 3 caracteres.');
        temErro = true;
    }
    if (!userValidator.validarEmail(campoEmail.value)) {
        userValidator.exibirErro(campoEmail, 'Email inválido.');
        temErro = true;
    }
    if (!userValidator.validarPassword(campoPass.value)) {
        userValidator.exibirErro(campoPass, 'Password requer Maiúscula/Minúscula/Número e 8 caracteres.');
        temErro = true;
    }
    if (campoNif.value.length !== 9) {
        userValidator.exibirErro(campoNif, 'NIF deve ter 9 dígitos.');
        temErro = true;
    }
    if (!userValidator.validarTelefone(campoTel.value)) {
        userValidator.exibirErro(campoTel, 'Telefone inválido.');
        temErro = true;
    }

    if (temErro) {
        e.preventDefault();
    }
}

formRegistar.addEventListener('submit', validarRegisto);
