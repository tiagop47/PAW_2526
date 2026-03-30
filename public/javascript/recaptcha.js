/**
 * Integração do Google reCAPTCHA v3
 */
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form[action="/auth/registar"]');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            // Se as validações básicas falharem, não fazemos nada
            if (e.defaultPrevented) return;

            e.preventDefault(); // Para o envio para gerar o token primeiro

            // O siteKey é injetado pelo EJS no HTML
            const siteKey = document.querySelector('script[src*="recaptcha/api.js"]').src.split('render=')[1];

            grecaptcha.ready(function() {
                grecaptcha.execute(siteKey, {action: 'registar'}).then(function(token) {
                    // Colocar o token no campo oculto
                    document.getElementById('g-recaptcha-response').value = token;
                    // Agora sim, submeter o formulário (o .submit() do DOM não dispara o evento 'submit' novamente)
                    form.submit();
                });
            });
        });
    }
});
