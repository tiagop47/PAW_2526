document.addEventListener("DOMContentLoaded", function () {
    // Confirmar Rejeição de Supermercado
    const botoesRejeitar = document.querySelectorAll('.btn-rejeitar-supermercado');
    botoesRejeitar.forEach(btn => {
        btn.addEventListener("click", function (e) {
            if (!confirm("Tem a certeza que deseja rejeitar este supermercado? Esta ação é irreversível.")) {
                e.preventDefault();
            }
        });
    });

    // Filtros de Utilizadores (Procura em tempo real na tabela)
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
