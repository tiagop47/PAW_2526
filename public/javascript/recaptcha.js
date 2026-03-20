function validarComRecaptcha(event, siteKey, actionName) {
    event.preventDefault();

    const form = event.target; 

    grecaptcha.ready(function() {
        grecaptcha.execute(siteKey, { action: actionName }).then(function(token) {
            
            document.getElementById('g-recaptcha-response').value = token;
            
            form.submit(); 
        });
    });
}