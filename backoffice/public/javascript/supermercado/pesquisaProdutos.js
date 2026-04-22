const inputPesquisa = document.querySelector('[data-produto-pesquisa="input"]');
const selectCategoria = document.querySelector('[data-produto-pesquisa="categoria"]');
const tabelaBody = document.querySelector('[data-produto-pesquisa="tabela"]');

let paginaAtualGlobal = 1;

function tabelaDefault(dados) {
    if (!tabelaBody) return;
    const produtos = dados.produtos || [];

    if (produtos.length === 0) {
        tabelaBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">Nenhum produto encontrado.</td></tr>';
        renderizarPaginacao(0, 0);
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

    renderizarPaginacao(dados.paginaAtual, dados.totalPaginas);
}

function renderizarPaginacao(atual, total) {
    let paginacaoContainer = document.getElementById('paginacaoPesquisa');
    if (!paginacaoContainer) {
        paginacaoContainer = document.createElement('div');
        paginacaoContainer.id = 'paginacaoPesquisa';
        paginacaoContainer.className = 'd-flex justify-content-center align-items-center mt-3 gap-2';
        tabelaBody.closest('.table-responsive').after(paginacaoContainer);
    }

    if (total <= 1) {
        paginacaoContainer.innerHTML = '';
        return;
    }

    paginacaoContainer.innerHTML = `
        <button class="btn btn-sm btn-light border" ${atual === 1 ? 'disabled' : ''} onclick="mudarPaginaPesquisa(${atual - 1})">Anterior</button>
        <span class="small text-muted">Página ${atual} de ${total}</span>
        <button class="btn btn-sm btn-light border" ${atual === total ? 'disabled' : ''} onclick="mudarPaginaPesquisa(${atual + 1})">Próximo</button>
    `;
}

// Tornar global para acesso nos botões dinâmicos
window.mudarPaginaPesquisa = function(novaPagina) {
    paginaAtualGlobal = novaPagina;
    const { executarPesquisa } = window.pesquisaInstancia || {};
    if (executarPesquisa) executarPesquisa(novaPagina);
};

function inicializarPesquisaProdutos(config = {}) {
    if (!inputPesquisa || !selectCategoria) return;

    const {
        renderTabela = tabelaDefault,
        debounceMs = 300,
        apiUrl = '/supermercado/produtos/pesquisar'
    } = config;

    async function executarPesquisa(pagina = 1) {
        paginaAtualGlobal = pagina;
        const params = new URLSearchParams();
        const texto = inputPesquisa.value.trim();
        const categoriaId = selectCategoria.value;

        if (texto) params.set('q', texto);
        if (categoriaId) params.set('categoriaId', categoriaId);
        params.set('pagina', pagina);

        try {
            const resposta = await fetch(`${apiUrl}?${params.toString()}`);
            if (!resposta.ok) return;

            const dados = await resposta.json();
            renderTabela(dados, tabelaBody);
        } catch (err) {
            console.error('Erro na pesquisa:', err);
        }
    }

    let timer;
    inputPesquisa.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => executarPesquisa(1), debounceMs);
    });

    selectCategoria.addEventListener('change', () => executarPesquisa(1));

    window.pesquisaInstancia = { executarPesquisa };
    return { executarPesquisa };
}

