const palavraPasse = document.getElementById("password");
const botaoAlternar = document.getElementById("togglePassword");

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
