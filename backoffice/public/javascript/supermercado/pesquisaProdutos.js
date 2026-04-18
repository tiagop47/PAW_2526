const inputPesquisa = document.querySelector('[data-produto-pesquisa="input"]');
const selectCategoria = document.querySelector('[data-produto-pesquisa="categoria"]');
const tabelaBody = document.querySelector('[data-produto-pesquisa="tabela"]');

function tabelaDefault(produtos) {
    if (!tabelaBody) return;
    if (produtos.length === 0) {
        tabelaBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">Nenhum produto encontrado.</td></tr>';
        return;
    }

    tabelaBody.innerHTML = produtos.map(p => `
        <tr>
            <td>
                <div class="fw-bold">${p.nome}</div>
            </td>
            <td>
                <span class="badge border text-dark fw-normal">${p.categoriaId ? p.categoriaId.nome : '—'}</span>
            </td>
            <td>${Number(p.preco).toFixed(2)}€</td>
            <td>${p.stockDisponivel}</td>
            <td class="text-end">
                <div class="d-flex justify-content-end gap-2">
                    <a href="/supermercado/produtos/${p._id}" class="btn btn-sm btn-light border">Detalhes</a>
                    <a href="/supermercado/produtos/editar/${p._id}" class="btn btn-sm btn-light border">Editar</a>
                    <form action="/supermercado/produtos/eliminar/${p._id}" method="POST" class="d-inline" onsubmit="return confirm('Tem a certeza?')">
                        <button type="submit" class="btn btn-sm btn-outline-danger">Eliminar</button>
                    </form>
                </div>
            </td>
        </tr>
    `).join('');
}

function inicializarPesquisaProdutos(config = {}) {
    if (!inputPesquisa || !selectCategoria) return;

    const {
        renderTabela = tabelaDefault,
        debounceMs = 300,
        apiUrl = '/supermercado/produtos/pesquisar' // URL padrão
    } = config;

    async function executarPesquisa() {
        const params = new URLSearchParams();
        const texto = inputPesquisa.value.trim();
        const categoriaId = selectCategoria.value;

        if (texto) {
            params.set('q', texto);
        }
        if (categoriaId) {
            params.set('categoriaId', categoriaId);
        }

        try {
            const resposta = await fetch(`${apiUrl}?${params.toString()}`);
            if (!resposta.ok) return;

            const produtos = await resposta.json();
            renderTabela(produtos, tabelaBody);
        } catch (err) {
            console.error('Erro na pesquisa:', err);
        }
    }

    let timer;
    inputPesquisa.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(executarPesquisa, debounceMs);
    });

    selectCategoria.addEventListener('change', executarPesquisa);

    return { executarPesquisa };
}

