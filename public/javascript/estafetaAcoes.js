const estafetaId = document.body.getAttribute('data-estafeta-id') || '';
const storageZonaKey = `estafeta_zona_trabalho_${estafetaId || 'default'}`;
const paginaEntregas = !!estafetaId;

let zonaTrabalhoAtiva = '';

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
            location.reload();
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

    try {
        const response = await fetch(`/estafeta/api/entregas/${id}/confirmar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();

        if (data.sucesso) {
            alert('Entrega confirmada com sucesso!');
            location.reload();
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

const aplicarFiltroZona = function () {
    if (!paginaEntregas) return;

    const cards = document.querySelectorAll('.order-card');

    cards.forEach((card) => {
        const zonaCard = (card.getAttribute('data-zona') || '').trim().toLowerCase();
        card.style.display = (!zonaTrabalhoAtiva || zonaCard === zonaTrabalhoAtiva) ? '' : 'none';
    });

    filtrarMercadosNoMapa(zonaTrabalhoAtiva);
};

window.aplicarFiltroZonaAtiva = aplicarFiltroZona;

const atualizarZonaAtual = function () {
    return;
};

const carregarZonaDaSessao = function () {
    zonaTrabalhoAtiva = (sessionStorage.getItem(storageZonaKey) || '').trim().toLowerCase();
    if (zonaTrabalhoAtiva) return;

    alert('Define a zona de trabalho no dashboard antes de abrir as encomendas.');
    location.href = '/estafeta/dashboard';
};

document.addEventListener('click', async function (e) {
    const btn = e.target;

    if (btn.classList.contains('link-focar-destino')) {
        e.preventDefault();
        focarDestinoNoMapa(btn.dataset.lat, btn.dataset.lng);
    }

    if (btn.classList.contains('btn-aceitar-entrega')) {
        await tratarAceitarEntrega(btn.dataset.id, btn);
    }

    if (btn.classList.contains('btn-confirmar-entrega')) {
        await tratarConfirmarEntrega(btn.dataset.id, btn);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    if (paginaEntregas) {
        carregarZonaDaSessao();
        if (!zonaTrabalhoAtiva) return;

        inicializarMapa('mapa-entregas');
        carregarMercadosDoServidor();
        atualizarZonaAtual();
        aplicarFiltroZona();
    }
});
