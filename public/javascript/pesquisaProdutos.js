const inputPesquisa = document.querySelector('[data-produto-pesquisa="input"]');
const selectCategoria = document.querySelector('[data-produto-pesquisa="categoria"]');
const tabelaBody = document.querySelector('[data-produto-pesquisa="tabela"]');

function tabelaDefault(produtos) {
    if (!tabelaBody) return;
    if (produtos.length === 0) {
        tabelaBody.innerHTML = '<tr><td colspan="5" class="text-center py-4">Nenhum produto encontrado.</td></tr>';
        return;
    }

    tabelaBody.innerHTML = produtos.map(p => `
        <tr>
            <td><a href="/supermercado/produtos/${p._id}" class="text-decoration-none text-dark">${p.nome}</a></td>
            <td>${p.categoria}</td>
            <td>${p.preco}€</td>
            <td>${p.stockDisponivel}</td>
            <td>
                <a href="/supermercado/produtos/editar/${p._id}" class="btn btn-sm">Editar</a>
                <form action="/supermercado/produtos/eliminar/${p._id}" method="POST" class="d-inline">
                    <button type="submit" class="btn btn-sm text-danger">Eliminar</button>
                </form>
            </td>
        </tr>
    `).join('');
}

function inicializarPesquisaProdutos(config = {}) {
    if (!inputPesquisa || !selectCategoria) return;

    const {
        renderTabela = tabelaDefault,
        debounceMs = 300
    } = config;

    async function executarPesquisa() {
        const params = new URLSearchParams();
        const texto = inputPesquisa.value.trim();
        const categoria = selectCategoria.value;

        if (texto) {
            params.set('q', texto);
        }
        if (categoria) {
            params.set('categoria', categoria);
        }

        try {
            const resposta = await fetch(`/supermercado/api/produtos?${params.toString()}`);
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

