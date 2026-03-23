const corpoTabelaEl = document.getElementById('corpo-tabela');
const infoPaginaEl = document.getElementById('info-pagina');
const btnAntEl = document.getElementById('btn-ant');
const btnProxEl = document.getElementById('btn-prox');

let contadorAtual = 0;

/**
 * Carrega supermercados de 3 em 3 e injeta na tabela.
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
            html = '<tr><td colspan="3" class="text-center py-4 text-muted">Sem supermercados ativos.</td></tr>';
        } else {
            supermercados.forEach(s => {
                html += `
                    <tr>
                        <td class="ps-3">${s.nome}</td>
                        <td>${s.localizacao}</td>
                        <td class="text-end pe-3">
                            <button onclick="bloquearSupermercado('${s._id}', ${contador})" class="btn btn-sm btn-secondary">Bloquear</button>
                        </td>
                    </tr>`;
            });
        }
        corpoTabelaEl.innerHTML = html;

        if (infoPaginaEl) {
            infoPaginaEl.innerText = `Página ${paginaAtual} de ${totalPaginas}`;
        }

        if (btnAntEl) {
            btnAntEl.disabled = (contador === 0);
        }
        if (btnProxEl) {
            btnProxEl.disabled = (paginaAtual >= totalPaginas);
        }

    } catch (err) {
        console.error('Erro:', err);
    }
}

/**
 * Bloqueia um supermercado e atualiza a lista.
 */
async function bloquearSupermercado(id, contador) {
    if (!confirm('Bloquear este supermercado?')) return;
    try {
        const res = await fetch(`/admin/supermercados/bloquear/${id}`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            carregarSupermercados(contador);
        }
    } catch (err) {
        console.error(err);
    }
}

if (btnAntEl) {
    btnAntEl.addEventListener('click', function () {
        carregarSupermercados(Math.max(0, contadorAtual - 3));
    });
}

if (btnProxEl) {
    btnProxEl.addEventListener('click', function () {
        carregarSupermercados(contadorAtual + 3);
    });
}

if (corpoTabelaEl) {
    carregarSupermercados(0);
}
