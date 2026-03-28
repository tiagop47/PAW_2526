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

document.addEventListener('DOMContentLoaded', function () {
    const formLogin = document.querySelector('form[action="/auth/login"]');
    const formRegistar = document.querySelector('form[action="/auth/registar"]');

    if (formLogin) {
        formLogin.onsubmit = function (e) {
            const email = document.getElementById('emailInput');
            const pass = document.getElementById('password');
            let temErro = false;

            if (email && !validarEmail(email.value)) {
                exibirErro('emailInput', 'Email inválido.');
                temErro = true;
            }
            if (pass && pass.value.length < 1) {
                exibirErro('password', 'Password obrigatória.');
                temErro = true;
            }

            if (temErro) e.preventDefault();
        };
    }

    if (formRegistar) {
        formRegistar.onsubmit = function (e) {
            const nome = document.getElementById('nome');
            const email = document.getElementById('email');
            const pass = document.getElementById('password');
            let temErro = false;

            if (nome && nome.value.length < 3) {
                exibirErro('nome', 'Nome demasiado curto.');
                temErro = true;
            }
            if (email && !validarEmail(email.value)) {
                exibirErro('email', 'Email inválido.');
                temErro = true;
            }
            if (pass && pass.value.length < 6) {
                exibirErro('password', 'Mínimo 6 caracteres.');
                temErro = true;
            }

            if (temErro) e.preventDefault();
        };
    }
});

document.addEventListener("input", function (e) {
    if (e.target.classList.contains('is-invalid')) {
        limparErro(e.target.id);
    }
});
