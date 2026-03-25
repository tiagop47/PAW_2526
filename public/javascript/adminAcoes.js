const corpoTabelaEl = document.getElementById('corpo-tabela');
const infoPaginaEl = document.getElementById('info-pagina');
const btnAntEl = document.getElementById('btn-ant');
const btnProxEl = document.getElementById('btn-prox');

let contadorAtual = 0;

/**
 * Tabela de Gestão de Supermercados
 */
async function carregarSupermercados(contador = 0) {
    if (!corpoTabelaEl) return;

    try {
        contadorAtual = contador;
        const res = await fetch(`/admin/supermercados/ativos?contador=${contador}`);
        const data = await res.json();
        const { supermercados, paginaAtual, totalPaginas } = data;

        let html = '';
        if (supermercados.length === 0 && contador === 0) {
            html = '<tr><td colspan="2" class="text-center py-3 text-muted">Vazio</td></tr>';
        } else {
            supermercados.forEach(s => {
                html += `
                    <tr>
                        <td class="ps-3 py-2 fw-bold text-dark">${s.nome}</td>
                        <td class="text-end pe-3 text-muted small">${s.localizacao || 'Coordenadas'}</td>
                    </tr>`;
            });
        }
        corpoTabelaEl.innerHTML = html;

        if (infoPaginaEl) infoPaginaEl.innerText = `${paginaAtual}/${totalPaginas}`;
        if (btnAntEl) btnAntEl.disabled = (contador === 0);
        if (btnProxEl) btnProxEl.disabled = (paginaAtual >= totalPaginas);

    } catch (err) { console.error('Erro:', err); }
}

if (btnAntEl) btnAntEl.addEventListener('click', () => carregarSupermercados(Math.max(0, contadorAtual - 3)));
if (btnProxEl) btnProxEl.addEventListener('click', () => carregarSupermercados(contadorAtual + 3));

document.addEventListener('DOMContentLoaded', () => {
    if (corpoTabelaEl) carregarSupermercados(0);
});
