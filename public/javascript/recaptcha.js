/**
 * Integração do Google reCAPTCHA v3
 */
document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('form[action="/auth/registar"]');

    if (form) {
        form.addEventListener('submit', function (e) {
            if (e.defaultPrevented) {
                return;
            }

            e.preventDefault();

            const siteKey = document.querySelector('script[src*="recaptcha/api.js"]').src.split('render=')[1];

            grecaptcha.ready(function () {
                grecaptcha.execute(siteKey, { action: 'registar' }).then(function (token) {
                    document.getElementById('g-recaptcha-response').value = token;
                    form.submit();
                });
            });
        });
    }
});
