document.addEventListener("DOMContentLoaded", function() {
    // Confirmar Aceitação de Entrega
    const btnsAceitar = document.querySelectorAll('.btn-aceitar-entrega');
    btnsAceitar.forEach(btn => {
        btn.addEventListener("click", function(e) {
            if (!confirm("Deseja aceitar esta entrega? Terá de a concluir num tempo razoável.")) {
                e.preventDefault();
            }
        });
    });

    // Filtros de Entregas por Estado (Ocultar/Mostrar linhas da tabela)
    const selectFiltroEstado = document.getElementById("filtroEstadoEntrega");
    if (selectFiltroEstado) {
        selectFiltroEstado.addEventListener("change", function() {
            const estadoSelecionado = selectFiltroEstado.value;
            const linhas = document.querySelectorAll("table tbody tr");
            
            linhas.forEach(linha => {
                const estadoLinha = linha.getAttribute('data-estado');
                if (estadoSelecionado === "todas" || estadoLinha === estadoSelecionado) {
                    linha.style.display = "";
                } else {
                    linha.style.display = "none";
                }
            });
        });
    }
});
