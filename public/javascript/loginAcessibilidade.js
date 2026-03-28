const palavraPasse = document.getElementById("password");
const botaoAlternar = document.getElementById("togglePassword");

const emailLogin = document.getElementById("emailInput");
const relembrar = document.getElementById("rememberMe");
const dropdownEmails = document.getElementById("dropdownEmails");
const btnDropdown = document.getElementById("btnDropdownEmails");

function guardarEmail() {
    if (relembrar && relembrar.checked) {
        const email = emailLogin.value;

        let emails = JSON.parse(localStorage.getItem("emails") || "[]");

        if (!emails.includes(email)) {
            emails.push(email);
            localStorage.setItem("emails", JSON.stringify(emails));
        }
    }
}

function preencherDropdown() {
    if (!dropdownEmails) return;

    const emails = JSON.parse(localStorage.getItem("emails") || "[]");

    if (emails.length === 0) {
        dropdownEmails.innerHTML = '<li><span class="dropdown-item-text small text-muted">Sem emails guardados</span></li>';
        return;
    }

    dropdownEmails.innerHTML = ""; // Limpar a lista

    emails.forEach(email => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.className = "dropdown-item small";
        a.href = "#";
        a.innerText = email;

        a.addEventListener("click", function(e) {
            e.preventDefault();
            emailLogin.value = email;
        });

        li.appendChild(a);
        dropdownEmails.appendChild(li); 
    });
}

if (btnDropdown) {
    btnDropdown.addEventListener("show.bs.dropdown", preencherDropdown);
}

preencherDropdown();

if (palavraPasse && botaoAlternar) {
    botaoAlternar.addEventListener("click", function () {
        const tipoAtual = palavraPasse.type;
        if (tipoAtual === "password") {
            palavraPasse.type = "text";
            botaoAlternar.innerText = "Ocultar";
        } else {
            palavraPasse.type = "password";
            botaoAlternar.innerText = "Ver";
        }
    });
}
