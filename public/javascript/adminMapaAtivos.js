document.addEventListener('DOMContentLoaded', function() {
    const mapaElement = document.getElementById('mapa-supermercados-ativos');
    if (!mapaElement || typeof AppMapa === 'undefined') return;

    // Obter dados injetados via data-attributes
    const dadosBrutos = document.getElementById('dados-supermercados-ativos');
    if (!dadosBrutos) return;

    const supermercadosAtivos = JSON.parse(dadosBrutos.getAttribute('data-supermercados') || '[]');
    let paginaAtualTabela = parseInt(dadosBrutos.getAttribute('data-pagina-atual') || '1');
    let totalPaginasTabela = parseInt(dadosBrutos.getAttribute('data-total-paginas') || '1');

    // Inicializar mapa centralizado
    const mapa = AppMapa.init('mapa-supermercados-ativos', [41.15, -8.61], 11);
    const pontos = [];

    supermercadosAtivos.forEach((s) => {
        if (s.localizacaoGeo && Array.isArray(s.localizacaoGeo.coordinates) && s.localizacaoGeo.coordinates.length === 2) {
            const [lon, lat] = s.localizacaoGeo.coordinates;
            
            // Usar lógica centralizada de adicionar área (com visual=true para o Admin)
            AppMapa.addArea(s.nome, lat, lon, s.raioAtuacao || 5, {
                color: '#0d6efd',
                visual: true,
                popupContent: `<strong>${s.nome}</strong><br>${s.localizacao || 'Definido por Coordenadas'}<br>Raio: ${Number(s.raioAtuacao || 5).toLocaleString('pt-PT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}km`
            });

            pontos.push([lat, lon]);
        }
    });

    if (pontos.length > 0) {
        mapa.fitBounds(pontos, { padding: [80, 80], maxZoom: 11 });
    }

    // --- Restante Lógica de Tabela e Paginacao (Mantida) ---
    const corpoSupermercadosEl = document.getElementById('corpo-supermercados');
    const infoPaginaEl = document.getElementById('info-pagina-supermercados');
    const btnAntEl = document.getElementById('btn-ant-supermercados');
    const btnProxEl = document.getElementById('btn-prox-supermercados');

    const formatarKm = (valor) =>
        Number(valor || 5).toLocaleString('pt-PT', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + 'km';

    const atualizarEstadoPaginacao = () => {
        if (infoPaginaEl) infoPaginaEl.textContent = `Página ${paginaAtualTabela} de ${totalPaginasTabela}`;
        if (btnAntEl) btnAntEl.disabled = paginaAtualTabela <= 1;
        if (btnProxEl) btnProxEl.disabled = paginaAtualTabela >= totalPaginasTabela;
    };

    const renderTabela = (supermercados) => {
        if (!corpoSupermercadosEl) return;
        
        if (!supermercados || supermercados.length === 0) {
            corpoSupermercadosEl.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-5 text-muted">Não existem supermercados ativos.</td>
                </tr>
            `;
            return;
        }

        corpoSupermercadosEl.innerHTML = supermercados.map((s) => `
            <tr>
                <td class="fw-bold">${s.nome || 'N/A'}</td>
                <td>${s.userId && s.userId.nome ? s.userId.nome : 'N/A'}</td>
                <td>${s.localizacao || 'Definido por Coordenadas'}</td>
                <td>${formatarKm(s.raioAtuacao)}</td>
            </tr>
        `).join('');
    };

    const carregarPagina = async (pagina) => {
        const resposta = await fetch(`/admin/supermercados/ativos?pagina=${pagina}&formato=json`, {
            headers: { Accept: 'application/json' }
        });

        if (!resposta.ok) {
            throw new Error('Erro a carregar supermercados.');
        }

        const dados = await resposta.json();
        paginaAtualTabela = dados.paginaAtual;
        totalPaginasTabela = dados.totalPaginas;
        renderTabela(dados.supermercados || []);
        atualizarEstadoPaginacao();
    };

    if (btnAntEl) {
        btnAntEl.addEventListener('click', async () => {
            if (paginaAtualTabela <= 1) return;
            try {
                await carregarPagina(paginaAtualTabela - 1);
            } catch (erro) {
                console.error(erro);
            }
        });
    }

    if (btnProxEl) {
        btnProxEl.addEventListener('click', async () => {
            if (paginaAtualTabela >= totalPaginasTabela) return;
            try {
                await carregarPagina(paginaAtualTabela + 1);
            } catch (erro) {
                console.error(erro);
            }
        });
    }

    atualizarEstadoPaginacao();
});
