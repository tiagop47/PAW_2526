document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    
    if (form) {
        form.addEventListener('submit', function (e) {
            const validator = window.userValidator;
            
            if (!validator) {
                console.error("userValidator não carregado!");
                return;
            }
            
            const emailInput = document.querySelector('input[name="email"]');
            const telefoneInput = document.querySelector('input[name="telefone"]');

            const email = emailInput ? emailInput.value : '';
            const telefone = telefoneInput ? telefoneInput.value : '';

            // Valida o Email
            if (email && !validator.validarEmail(email)) {
                alert("O formato do email é inválido.");
                e.preventDefault();
                return;
            }

            // Valida o Telefone
            if (telefone && !validator.validarTelefone(telefone)) {
                alert("O formato do telefone é inválido (deve possuir pelos menos 9 dígitos).");
                e.preventDefault();
                return;
            }
        });
    }
});