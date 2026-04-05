const formLogin = document.querySelector('form[action="/auth/login"]');
const formRegistar = document.querySelector('form[action="/auth/registar"]');

const campoEmailLogin = document.getElementById('emailInput');
const campoPasswordLogin = document.getElementById('password');

// Configurações de Validação (Sincronizadas com o Backend)
const EMAIL_REGEX = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@"]+\.)+[^<>()[\]\\.,;:\s@"]{2,})$/i;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const campoNomeRegisto = document.getElementById('nome');
const campoEmailRegisto = document.getElementById('email');
const campoPasswordRegisto = document.getElementById('password');
const campoNifRegisto = document.getElementById('nif');
const campoTelefoneRegisto = document.getElementById('telefone');

function validarEmail(email) {
    return EMAIL_REGEX.test(email);
}

function validarPassword(password) {
    return PASSWORD_REGEX.test(password);
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

    if (campoNomeRegisto && campoNomeRegisto.value.trim().length < 3) {
        exibirErro('nome', 'O nome deve ter pelo menos 3 caracteres.');
        temErro = true;
    }
    if (campoEmailRegisto && !validarEmail(campoEmailRegisto.value)) {
        exibirErro('email', 'Formato de email inválido.');
        temErro = true;
    }
    if (campoPasswordRegisto && !validarPassword(campoPasswordRegisto.value)) {
        exibirErro('password', 'Mínimo 8 caracteres (com Maiúscula, Minúscula e Número).');
        temErro = true;
    }
    if (campoNifRegisto && campoNifRegisto.value.length !== 9) {
        exibirErro('nif', 'O NIF deve ter exatamente 9 dígitos.');
        temErro = true;
    }
    if (campoTelefoneRegisto && campoTelefoneRegisto.value.toString().trim().length < 9) {
        exibirErro('telefone', 'O telefone deve ter pelo menos 9 dígitos.');
        temErro = true;
    }

    if (temErro) {
        e.preventDefault();
        // Scroll para o primeiro erro
        const primeiroErro = document.querySelector('.is-invalid');
        if (primeiroErro) primeiroErro.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
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
