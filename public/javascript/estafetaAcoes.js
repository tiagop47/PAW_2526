

const selectFiltroEstado = document.getElementById('filtroEstadoEntrega');
const btnMinhaPosicao = document.getElementById('btn-minha-posicao');
const elementoMapaEstafeta = document.getElementById('mapa-estafeta');

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

const tratarAceitarEntrega = async (id, btn) => {

    btn.disabled = true;
    const textoOriginal = btn.textContent;
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
            btn.textContent = textoOriginal;
        }
    } catch (error) {
        alert('Erro de comunicação com o servidor');
        btn.disabled = false;
        btn.textContent = textoOriginal;
    }
};

const tratarConfirmarEntrega = async (id, btn) => {
    if (!confirm('Confirmar que a entrega foi realizada com sucesso?')) return;

    btn.disabled = true;
    const textoOriginal = btn.textContent;
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
            btn.textContent = textoOriginal;
        }
    } catch (error) {
        alert('Erro de comunicação com o servidor');
        btn.disabled = false;
        btn.textContent = textoOriginal;
    }
};


if (selectFiltroEstado) {
    selectFiltroEstado.addEventListener('change', filtrarLinhasPorEstado);
}

document.addEventListener('click', async function (e) {
    const btn = e.target;

    if (btn.classList.contains('btn-aceitar-entrega')) {
        await tratarAceitarEntrega(btn.dataset.id, btn);
    }

    if (btn.classList.contains('btn-confirmar-entrega')) {
        await tratarConfirmarEntrega(btn.dataset.id, btn);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    if (typeof AppMapa !== 'undefined' && elementoMapaEstafeta) {
        AppMapa.init('mapa-estafeta');
        AppMapa.carregarSupermercados({ endpoint: '/estafeta/api/supermercados' });
    }

    if (btnMinhaPosicao) {
        btnMinhaPosicao.addEventListener('click', () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(pos => {
                    const { latitude, longitude } = pos.coords;
                    if (typeof AppMapa !== 'undefined' && AppMapa.map) {
                        AppMapa.map.setView([latitude, longitude], 13);
                        AppMapa.addEstafeta(latitude, longitude);
                    }
                });
            } else {
                alert("O seu navegador não suporta geolocalização.");
            }
        });
    }
});
