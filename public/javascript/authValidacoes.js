const formLogin = document.querySelector('form[action="/auth/login"]');
const formRegistar = document.querySelector('form[action="/auth/registar"]');
const emailLoginInput = document.getElementById('emailInput');
const passwordLoginInput = document.getElementById('password');

const nomeRegistoInput = document.getElementById('nome');
const emailRegistoInput = document.getElementById('email');
const passwordRegistoInput = document.getElementById('password');
const telefoneRegistoInput = document.getElementById('telefone');



const validarSubmitLogin = function (e) {
    let temErro = false;

    if (emailLoginInput && !validarEmail(emailLoginInput.value)) {
        exibirErro('floatingInput', 'Insira um email válido.');
        temErro = true;
    }

    if (passwordLoginInput && passwordLoginInput.value.length < 1) {
        exibirErro('password', 'A password é obrigatória.');
        temErro = true;
    }

    if (temErro) {
        e.preventDefault();
    }
};

const validarSubmitRegisto = function (e) {
    let temErro = false;

    if (nomeRegistoInput && nomeRegistoInput.value.length < 3) {
        exibirErro('nome', 'O nome deve ter pelo menos 3 caracteres.');
        temErro = true;
    }

    if (emailRegistoInput && !validarEmail(emailRegistoInput.value)) {
        exibirErro('email', 'Insira um email válido.');
        temErro = true;
    }

    if (passwordRegistoInput && passwordRegistoInput.value.length < 8) {
        exibirErro('password', 'A password deve ter pelo menos 8 caracteres.');
        temErro = true;
    }

    if (telefoneRegistoInput && telefoneRegistoInput.value.length < 9) {
        exibirErro('telefone', 'O telefone deve ter pelo menos 9 dígitos.');
        temErro = true;
    }

    if (temErro) {
        e.preventDefault();
        e.stopImmediatePropagation();
    }
};

if (formLogin) {
    formLogin.addEventListener('submit', validarSubmitLogin);
}

if (formRegistar) {
    formRegistar.addEventListener('submit', validarSubmitRegisto);
}
