document.addEventListener("DOMContentLoaded", function () {
    const formsComConfirmacao = document.querySelectorAll("btnConfirmar");

    formsComConfirmacao.forEach(form => {
        form.addEventListener("submit", function (e) {
            const mensagem = form.dataset.confirmMessage || "Deseja continuar?";

            if (!confirm(mensagem)) {
                e.preventDefault();
            }
        });
    });

    const inputProcura = document.getElementById("procuraUtilizador");
    if (inputProcura) {
        inputProcura.addEventListener("keyup", function () {
            const filtro = inputProcura.value.toLowerCase();
            const linhas = document.querySelectorAll("table tbody tr");

            linhas.forEach(linha => {
                const texto = linha.innerText.toLowerCase();
                linha.style.display = texto.includes(filtro) ? "" : "none";
            });
        });
    }
});