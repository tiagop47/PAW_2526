const cards = document.querySelectorAll('.order-card');
const estafetaId = document.body.getAttribute('data-estafeta-id') || '';
const storageZonaKey = `estafeta_zona_trabalho_${estafetaId || 'default'}`;
const paginaEntregas = !!estafetaId;

const CLASSE_FOCAR_DESTINO = 'link-focar-destino';
const CLASSE_BTN_ACEITAR = 'btn-aceitar-entrega';
const CLASSE_BTN_CONFIRMAR = 'btn-confirmar-entrega';
const ACOES_BOTOES_ENTREGA = {
    [CLASSE_BTN_ACEITAR]: {
        endpoint: 'aceitar',
        mensagemSucesso: 'Entrega aceite com sucesso!',
        mensagemErro: 'Não foi possível aceitar a entrega'
    },
    [CLASSE_BTN_CONFIRMAR]: {
        confirmacao: 'Confirmar que a entrega foi realizada com sucesso?',
        endpoint: 'confirmar',
        mensagemSucesso: 'Entrega confirmada com sucesso!',
        mensagemErro: 'Não foi possível confirmar a entrega'
    }
};

let zonaTrabalhoAtiva = '';

const submeterAcaoEntrega = async ({ id, btn, endpoint, mensagemSucesso, mensagemErro }) => {
    try {
        const response = await fetch(`/api/estafeta/entregas/${id}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();

        if (data.sucesso) {
            alert(mensagemSucesso);
            location.reload();
            return;
        }

        alert('Erro: ' + (data.erro || mensagemErro));
    } catch (error) {
        alert('Erro de comunicação com o servidor');
    }
};

const aplicarFiltroZona = function () {
    if (!paginaEntregas) {
        return;
    }

    cards.forEach((card) => {
        const zonaCard = (card.getAttribute('data-zona') || '').trim().toLowerCase();
        card.style.display = (!zonaTrabalhoAtiva || zonaCard === zonaTrabalhoAtiva) ? '' : 'none';
    });

    filtrarMercadosNoMapa(zonaTrabalhoAtiva);
};

const carregarZonaDaSessao = function () {
    zonaTrabalhoAtiva = (sessionStorage.getItem(storageZonaKey) || '').trim().toLowerCase();
    if (zonaTrabalhoAtiva) return;

    alert('Define a zona de trabalho no dashboard antes de abrir as encomendas.');
    location.href = '/estafeta/dashboard';
};

document.addEventListener('click', async function (e) {
    const btn = e.target.closest('button, a');
    if (!btn) return;

    if (btn.classList.contains(CLASSE_FOCAR_DESTINO)) {
        e.preventDefault();
        focarDestinoNoMapa(btn.dataset.lat, btn.dataset.lng);
        return;
    }

    const classeAcao = Object.keys(ACOES_BOTOES_ENTREGA).find((classe) => btn.classList.contains(classe));
    if (!classeAcao) return;

    const configAcao = ACOES_BOTOES_ENTREGA[classeAcao];
    if (configAcao.confirmacao && !confirm(configAcao.confirmacao)) return;

    await submeterAcaoEntrega({
        id: btn.dataset.id,
        btn,
        endpoint: configAcao.endpoint,
        mensagemSucesso: configAcao.mensagemSucesso,
        mensagemErro: configAcao.mensagemErro
    });
});

document.addEventListener('DOMContentLoaded', async () => {
    if (paginaEntregas) {
        carregarZonaDaSessao();

        if (!zonaTrabalhoAtiva) {
            return;
        }

        inicializarMapa('mapa-entregas');
        await carregarMercadosDoServidor();
        aplicarFiltroZona();
    }
});
