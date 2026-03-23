const formsComConfirmacao = document.querySelectorAll('.js-confirm-submit');
const btnsAceitar = document.querySelectorAll('.btn-aceitar-entrega');
const selectFiltroEstado = document.getElementById('filtroEstadoEntrega');

const confirmarSubmissao = function (e) {
    const mensagem = this.dataset.confirmMessage || 'Deseja continuar?';
    if (!confirm(mensagem)) {
        e.preventDefault();
    }
};

const confirmarAceitacaoEntrega = function (e) {
    if (!confirm('Deseja aceitar esta entrega? Terá de a concluir num tempo razoável.')) {
        e.preventDefault();
    }
};

const filtrarLinhasPorEstado = function () {
    const estadoSelecionado = selectFiltroEstado.value;
    const linhas = document.querySelectorAll('table tbody tr');

    linhas.forEach(function (linha) {
        const estadoLinha = linha.getAttribute('data-estado');
        if (estadoSelecionado === 'todas' || estadoLinha === estadoSelecionado) {
            linha.style.display = '';
        } else {
            linha.style.display = 'none';
        }
    });
};

formsComConfirmacao.forEach(function (form) {
    form.addEventListener('submit', confirmarSubmissao);
});

btnsAceitar.forEach(function (btn) {
    btn.addEventListener('click', confirmarAceitacaoEntrega);
});

if (selectFiltroEstado) {
    selectFiltroEstado.addEventListener('change', filtrarLinhasPorEstado);
}
