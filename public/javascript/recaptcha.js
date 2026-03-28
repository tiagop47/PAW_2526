/**
 * Integração do Google reCAPTCHA v3
 */
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form[action="/auth/registar"]');
    
    if (form) {
        form.onsubmit = function(e) {
            e.preventDefault(); // Para o envio para gerar o token primeiro

            // O siteKey é injetado pelo EJS no HTML
            const siteKey = document.querySelector('script[src*="recaptcha/api.js"]').src.split('render=')[1];

            grecaptcha.ready(function() {
                grecaptcha.execute(siteKey, {action: 'registar'}).then(function(token) {
                    // Colocar o token no campo oculto
                    document.getElementById('g-recaptcha-response').value = token;
                    // Agora sim, submeter o formulário
                    form.submit();
                });
            });
        };
    }
});
