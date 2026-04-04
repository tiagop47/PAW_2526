const formLogin = document.querySelector('form[action="/auth/login"]');
const formRegistar = document.querySelector('form[action="/auth/registar"]');

const campoEmailLogin = document.getElementById('emailInput');
const campoPasswordLogin = document.getElementById('password');

const campoNomeRegisto = document.getElementById('nome');
const campoEmailRegisto = document.getElementById('email');
const campoPasswordRegisto = document.getElementById('password');

function validarEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function exibirErro(idCampo, mensagem) {
    const campo = document.getElementById(idCampo);
    if (!campo) return;

    const erroAntigo = campo.parentElement.querySelector('.invalid-feedback');
    if (erroAntigo) erroAntigo.remove();

    campo.classList.add('is-invalid');
    const divErro = document.createElement('div');
    divErro.className = 'invalid-feedback';
    divErro.innerText = mensagem;
    campo.parentElement.appendChild(divErro);
}

function limparErro(idCampo) {
    const campo = document.getElementById(idCampo);
    if (campo) {
        campo.classList.remove('is-invalid');
        const erro = campo.parentElement.querySelector('.invalid-feedback');
        if (erro) erro.remove();
    }
}

function validarSubmitLogin(e) {
    let temErro = false;

    if (campoEmailLogin && !validarEmail(campoEmailLogin.value)) {
        exibirErro('emailInput', 'Email inválido.');
        temErro = true;
    }
    if (campoPasswordLogin && campoPasswordLogin.value.length < 1) {
        exibirErro('password', 'Password obrigatória.');
        temErro = true;
    }

    if (temErro) e.preventDefault();
}

function validarSubmitRegisto(e) {
    let temErro = false;

    if (campoNomeRegisto && campoNomeRegisto.value.length < 3) {
        exibirErro('nome', 'Nome demasiado curto.');
        temErro = true;
    }
    if (campoEmailRegisto && !validarEmail(campoEmailRegisto.value)) {
        exibirErro('email', 'Email inválido.');
        temErro = true;
    }
    if (campoPasswordRegisto && campoPasswordRegisto.value.length < 6) {
        exibirErro('password', 'Mínimo 6 caracteres.');
        temErro = true;
    }

    if (temErro) e.preventDefault();
}

if (formLogin) {
    formLogin.addEventListener('submit', validarSubmitLogin);
}

if (formRegistar) {
    formRegistar.addEventListener('submit', validarSubmitRegisto);
}

document.addEventListener('input', function (e) {
    if (e.target.classList.contains('is-invalid')) {
        limparErro(e.target.id);
    }
});
