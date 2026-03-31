const inputProdutosPagina = document.querySelector('#pesquisa-produto');
const filtroCategoriaProdutosPagina = document.querySelector('#filtro-categoria');
const tabelaProdutosPagina = document.querySelector('#tabela-produtos');
const inputVendaPagina = document.querySelector('#pesquisaProdutoVenda');
const filtroCategoriaVendaPagina = document.querySelector('#filtroCategoriaVenda');
const tabelaProdutosVendaPagina = document.querySelector('#tabelaProdutosVenda tbody');


inicializarPesquisaProdutos();

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
    const pagina = config.pagina || 'produtos';
    const inputPesquisa = config.inputElemento
        || (pagina === 'venda' ? inputVendaPagina : inputProdutosPagina);
    const selectCategoria = config.categoriaElemento
        || (pagina === 'venda' ? filtroCategoriaVendaPagina : filtroCategoriaProdutosPagina);
    const tabelaBody = config.tabelaBodyElemento
        || (pagina === 'venda' ? tabelaProdutosVendaPagina : tabelaProdutosPagina);

    if (!inputPesquisa || !tabelaBody) return null;

    const endpoint = config.endpoint || '/supermercado/api/produtos';
    const debounceMs = Number.isFinite(config.debounceMs) ? config.debounceMs : 300;
    const montarParams = typeof config.montarParams === 'function'
        ? config.montarParams
        : ({ texto, categoria }) => {
            const params = new URLSearchParams();

            if (texto) {
                params.set('q', texto);
            }
            if (categoria) {
                params.set('categoria', categoria);
            }

            return params;
        };
    const renderTabela = typeof config.renderTabela === 'function' ? config.renderTabela : tabelaDefault;

    async function pesquisarProdutos() {
        const texto = inputPesquisa.value.trim();
        const categoria = selectCategoria ? selectCategoria.value : '';
        const params = montarParams({ texto, categoria, config });
        const query = params.toString();
        const url = query ? `${endpoint}?${query}` : endpoint;

        try {
            const resposta = await fetch(url);
            if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
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

    if (selectCategoria) {
        selectCategoria.addEventListener('change', pesquisarProdutos);
    }

    return { pesquisarProdutos };
}

