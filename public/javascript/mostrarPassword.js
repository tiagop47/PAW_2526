const pass = document.getElementById("password");
const btnToggle = document.getElementById("togglePassword");

if (pass && btnToggle) {
    btnToggle.addEventListener("click", () => {
        if (btnToggle.innerText === "Ver") {
            pass.type = "text";
            btnToggle.innerText = "Ocultar";
        } else {
            pass.type = "password";
            btnToggle.innerText = "Ver";
        }
    });
}