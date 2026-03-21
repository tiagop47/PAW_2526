document.addEventListener("DOMContentLoaded", function () {
    const formLogin = document.querySelector('form[action="/auth/login"]');
    const formRegistar = document.querySelector('form[action="/auth/registar"]');

    if (formLogin) {
        formLogin.addEventListener("submit", function (e) {
            let temErro = false;
            const email = document.getElementById("floatingInput");
            const password = document.getElementById("password");

            if (!validarEmail(email.value)) {
                exibirErro("floatingInput", "Insira um email válido.");
                temErro = true;
            }

            if (password.value.length < 1) {
                exibirErro("password", "A password é obrigatória.");
                temErro = true;
            }

            if (temErro) e.preventDefault();
        });
    }

    if (formRegistar) {
        formRegistar.addEventListener("submit", function (e) {
            let temErro = false;
            const nome = document.getElementById("nome");
            const email = document.getElementById("email");
            const password = document.getElementById("password");
            const telefone = document.getElementById("telefone");

            if (nome.value.length < 3) {
                exibirErro("nome", "O nome deve ter pelo menos 3 caracteres.");
                temErro = true;
            }

            if (!validarEmail(email.value)) {
                exibirErro("email", "Insira um email válido.");
                temErro = true;
            }

            if (password.value.length < 8) {
                exibirErro("password", "A password deve ter pelo menos 8 caracteres.");
                temErro = true;
            }

            if (telefone.value.length < 9) {
                exibirErro("telefone", "O telefone deve ter pelo menos 9 dígitos.");
                temErro = true;
            }

            if (temErro) {
                e.preventDefault();
                e.stopImmediatePropagation();
            }
        });
    }
});
