let supermercadosCarregados = 0;

/**
 * Carrega a lista de supermercados que já foram aprovados.
 */
async function carregarSupermercadosAtivos(reset = false) {
    if (reset) {
        supermercadosCarregados = 0;
        document.getElementById('lista-supermercados-ativos').innerHTML = '';
    }

    const container = document.getElementById('lista-supermercados-ativos');

    try {
        const response = await fetch(`/admin/supermercados/ativos?limite=5&contador=${supermercadosCarregados}`);
        const novosSupermercados = await response.json();

        // Se não houver nada e for o primeiro carregamento
        if (novosSupermercados.length === 0 && supermercadosCarregados === 0) {
            container.innerHTML = '<p class="text-center py-5 text-muted">Ainda não existem supermercados aprovados.</p>';
            return;
        }

        if (supermercadosCarregados === 0) {
            container.innerHTML = `
                <table class="table table-hover align-middle mb-0">
                    <thead class="bg-dark text-white">
                        <tr>
                            <th class="ps-4">Nome do Supermercado</th>
                            <th>Localização</th>
                            <th>Horario</th>
                            <th>Custo Entrega</th>
                            <th class="text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="corpo-tabela-supermercados"></tbody>
                </table>
                <div id="zona-botao-mais" class="text-center py-3 border-top bg-light">
                    <button onclick="carregarSupermercadosAtivos()" class="btn btn-sm btn-outline-primary">Ver mais parceiros...</button>
                </div>
            `;
        }

        const tbody = document.getElementById('corpo-tabela-supermercados');

        novosSupermercados.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="ps-4 fw-bold text-primary">${s.nome}</td>
                <td>${s.localizacao}</td>
                <td>${s.horarioFuncionamento}</td>
                <td>${s.custoEntrega.toFixed(2)}€</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-danger" onclick="bloquearSupermercado('${s._id}')">Bloquear</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        supermercadosCarregados += novosSupermercados.length;

    } catch (err) {
        console.error('Erro ao carregar supermercados:', err);
        if (supermercadosCarregados === 0) {
            container.innerHTML = '<p class="text-center py-5 text-danger">Erro ao carregar dados do servidor.</p>';
        }
    }
}

/**
 * Bloqueia um supermercado ativo via fetch POST.
 */
async function bloquearSupermercado(id) {
    if (!confirm('Tem a certeza que deseja bloquear este supermercado?')) {
        return;
    }

    try {
        const response = await fetch(`/admin/bloquearSupermercado/${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const resultado = await response.json();

        if (response.ok) {
            alert(resultado.message || 'Bloqueado com sucesso!');
            carregarSupermercadosAtivos(true);
        } else {
            alert('Erro: ' + (resultado.message));
        }
    } catch (err) {
        console.error('Erro:', err);
        alert('Ocorreu um erro ao comunicar com o servidor.');
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const formsComConfirmacao = document.querySelectorAll('.btnConfirmar, .js-confirm-submit');

    formsComConfirmacao.forEach(form => {
        form.addEventListener('submit', function (e) {
            const mensagem = form.dataset.confirmMessage || 'Deseja continuar?';
            if (!confirm(mensagem)) {
                e.preventDefault();
            }
        });
    });
});
