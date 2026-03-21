document.addEventListener("DOMContentLoaded", function () {
    // Seletores com nomes amigáveis (estilo escolar)
    const botaoAbrir = document.getElementById("botao-abrir-modal");
    const janelaModal = document.getElementById("janela-modal");
    const botaoFecharX = document.getElementById("botao-fechar-modal-x");
    const botaoCancelar = document.getElementById("botao-cancelar-modal");

    if (botaoAbrir && janelaModal) {

        // Função para Abrir a Janela
        botaoAbrir.addEventListener("click", function () {
            janelaModal.classList.add("show");
            janelaModal.style.display = "block";
            document.body.classList.add("modal-open");

            // Criar o fundo escuro (backdrop)
            const fundo = document.createElement("div");
            fundo.className = "modal-backdrop fade show";
            fundo.id = "fundo-escuro-modal";
            document.body.appendChild(fundo);
        });

        // Função para Fechar a Janela
        const fecharJanela = function () {
            janelaModal.classList.remove("show");
            janelaModal.style.display = "none";
            document.body.classList.remove("modal-open");

            const fundo = document.getElementById("fundo-escuro-modal");
            if (fundo) fundo.remove();
        };

        // Ligar os botões de fechar à função
        if (botaoFecharX) botaoFecharX.addEventListener("click", fecharJanela);
        if (botaoCancelar) botaoCancelar.addEventListener("click", fecharJanela);

        // Fechar se clicar fora da janela branca
        window.addEventListener("click", function (evento) {
            if (evento.target === janelaModal) {
                fecharJanela();
            }
        });
    }
});
