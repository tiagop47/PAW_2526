const palavraPasse = document.getElementById("password");
const botaoAlternar = document.getElementById("togglePassword");

let valorOriginal = palavraPasse.value;
let estaMascarada = false;

botaoAlternar.addEventListener("click", () => {
    if (estaMascarada) {
        palavraPasse.value = valorOriginal;
        botaoAlternar.innerText = "Ocultar";
        estaMascarada = false;
    } else {
        valorOriginal = palavraPasse.value;
        let valorMascarado = "";
        for (let indice = 0; indice < valorOriginal.length; indice++) {
            valorMascarado += "*";
        }
        palavraPasse.value = valorMascarado;
        botaoAlternar.innerText = "Ver";
        estaMascarada = true;
    }
});

