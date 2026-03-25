const selectFiltroEstado = document.getElementById('filtroEstadoEntrega');

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

if (selectFiltroEstado) {
    selectFiltroEstado.addEventListener('change', filtrarLinhasPorEstado);
}

// Aceitar Entrega
document.addEventListener('click', async function(e) {
    if (e.target.classList.contains('btn-aceitar-entrega')) {
        const btn = e.target;
        const id = btn.dataset.id;

        if (!confirm('Deseja aceitar esta entrega? Terá de a concluir num tempo razoável.')) {
            return;
        }

        btn.disabled = true;
        btn.textContent = 'A processar...';

        try {
            const response = await fetch(`/estafeta/api/entregas/${id}/aceitar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();

            if (data.sucesso) {
                alert('Entrega aceite com sucesso!');
                window.location.reload();
            } else {
                alert('Erro: ' + (data.erro || 'Não foi possível aceitar a entrega'));
                btn.disabled = false;
                btn.textContent = 'Aceitar Entrega';
            }
        } catch (error) {
            alert('Erro de comunicação com o servidor');
            btn.disabled = false;
            btn.textContent = 'Aceitar Entrega';
        }
    }
});

// Confirmar Entrega
document.addEventListener('click', async function(e) {
    if (e.target.classList.contains('btn-confirmar-entrega')) {
        const btn = e.target;
        const id = btn.dataset.id;

        if (!confirm('Confirmar que a entrega foi realizada com sucesso?')) {
            return;
        }

        btn.disabled = true;
        btn.textContent = 'A processar...';

        try {
            const response = await fetch(`/estafeta/api/entregas/${id}/confirmar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();

            if (data.sucesso) {
                alert('Entrega confirmada com sucesso!');
                window.location.reload();
            } else {
                alert('Erro: ' + (data.erro || 'Não foi possível confirmar a entrega'));
                btn.disabled = false;
                btn.textContent = 'Confirmar Entrega';
            }
        } catch (error) {
            alert('Erro de comunicação com o servidor');
            btn.disabled = false;
            btn.textContent = 'Confirmar Entrega';
        }
    }
});

/**
 * Inicialização do Mapa (Estafeta)
 */
document.addEventListener('DOMContentLoaded', () => {
    if (typeof AppMapa !== 'undefined' && document.getElementById('mapa-estafeta')) {
        AppMapa.init('mapa-estafeta');
        AppMapa.carregarSupermercados();

        const btnPosicao = document.getElementById('btn-minha-posicao');
        if (btnPosicao) {
            btnPosicao.addEventListener('click', () => {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(pos => {
                        const { latitude, longitude } = pos.coords;
                        AppMapa.map.setView([latitude, longitude], 13);
                        AppMapa.addEstafeta(latitude, longitude);
                    });
                } else {
                    alert("O seu navegador não suporta geolocalização.");
                }
            });
        }
    }
});
