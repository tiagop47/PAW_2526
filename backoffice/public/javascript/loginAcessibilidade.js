const emailLogin = document.getElementById("emailInput");
const relembrar = document.getElementById("rememberMe");
const listaEmails = document.getElementById("dropdownEmails");
const pass = document.getElementById("password");
const btn = document.getElementById("togglePassword");

mostrarEmails();

function guardarEmail() {
    if (relembrar.checked) {
        const email = emailLogin.value;
        let emails = JSON.parse(localStorage.getItem("emails") || "[]");

        if (!emails.includes(email)) {
            emails.push(email);
            localStorage.setItem("emails", JSON.stringify(emails));
        }
    }
}

function mostrarEmails() {
    const emails = JSON.parse(localStorage.getItem("emails") || "[]");
    listaEmails.innerHTML = "";

    emails.forEach(function (email) {
        const li = document.createElement("li");
        li.innerHTML = `<a class="dropdown-item">${email}</a>`;

        li.onclick = function () {
            emailLogin.value = email;
        };

        listaEmails.appendChild(li);
    });
}

btn.onclick = function () {
    if (pass.type === "password") {
        pass.type = "text";
        btn.innerText = "Ocultar";
    } else {
        pass.type = "password";
        btn.innerText = "Ver";
    }
};
