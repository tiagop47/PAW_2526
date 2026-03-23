/**
 * Carrega supermercados de 3 em 3 e injeta na tabela.
 */
async function carregarSupermercados(contador = 0) {
    try {
        const res = await fetch(`/admin/supermercados/ativos?contador=${contador}`);
        const supermercados = await res.json();
        const tbody = document.getElementById('corpo-tabela');
        
        if (!tbody) return;

        // Gerar linhas da tabela
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
        tbody.innerHTML = html;

        // Configurar botões de navegação
        const btnAnt = document.getElementById('btn-ant');
        const btnProx = document.getElementById('btn-prox');

        if (btnAnt) {
            btnAnt.disabled = (contador === 0);
            btnAnt.onclick = () => carregarSupermercados(Math.max(0, contador - 3));
        }
        if (btnProx) {
            btnProx.disabled = (supermercados.length < 3);
            btnProx.onclick = () => carregarSupermercados(contador + 3);
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
        const res = await fetch(`/admin/bloquearSupermercado/${id}`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            carregarSupermercados(contador);
        }
    } catch (err) {
        console.error(err);
    }
}

// Iniciar automaticamente se estivermos na página correta
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('corpo-tabela')) {
        carregarSupermercados(0);
    }
});
