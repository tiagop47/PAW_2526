const ENDPOINT_PRODUTOS = '/supermercado/api/produtos';

const inputPesquisa = document.querySelector('[data-produto-pesquisa="input"]');
const selectCategoria = document.querySelector('[data-produto-pesquisa="categoria"]');
const tabelaBody = document.querySelector('[data-produto-pesquisa="tabela"]');

function tabelaDefault(produtos, tabelaBody) {
    if (!Array.isArray(produtos) || produtos.length === 0) {
        tabelaBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted py-4">
                    Nenhum produto registado.
                </td>
            </tr>`;
        return;
    }

    tabelaBody.innerHTML = produtos.map(p => `
        <tr>
            <td class="fw-bold">
                <a href="/supermercado/produtos/${p._id}" class="text-decoration-none text-dark">
                    ${p.nome}
                </a>
            </td>
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
    if (!inputPesquisa || !selectCategoria || !tabelaBody) {
        return;
    }

    const {
        renderTabela = tabelaDefault,
        debounceMs = 300
    } = config;

    async function pesquisarProdutos() {
        const params = new URLSearchParams();
        const texto = inputPesquisa.value.trim();
        const categoria = selectCategoria.value;

        if (texto) {
            params.set('q', texto);
        }
        if (categoria) {
            params.set('categoria', categoria);
        }

        const query = params.toString();
        const url = query ? `${ENDPOINT_PRODUTOS}?${query}` : ENDPOINT_PRODUTOS;

        try {
            const resposta = await fetch(url);
            if (!resposta.ok) {
                throw new Error(`HTTP ${resposta.status}`);
            }

            const produtos = await resposta.json();
            renderTabela(produtos, tabelaBody);
        } catch (err) {
            console.error('Erro na pesquisa:', err);
        }
    }

    let timer;
    inputPesquisa.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(pesquisarProdutos, debounceMs);
    });

    selectCategoria.addEventListener('change', pesquisarProdutos);

    return { pesquisarProdutos };
}

