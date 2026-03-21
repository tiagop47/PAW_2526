const inputPesquisa = document.getElementById('pesquisa-produto');
const selectCategoria = document.getElementById('filtro-categoria');
const tabelaBody = document.getElementById('tabela-produtos');

async function pesquisarProdutos() {
    const params = new URLSearchParams();

    const texto = inputPesquisa?.value?.trim();
    const categoria = selectCategoria?.value;

    if (texto) {
        params.set('q', texto);
    }
    if (categoria) {
        params.set('categoria', categoria);
    }

    try {
        const resposta = await fetch(`/supermercado/api/produtos?${params}`);
        const produtos = await resposta.json();

        atualizarTabela(produtos);
    } catch (err) {
        console.error('Erro na pesquisa:', err);
    }
}

function atualizarTabela(produtos) {
    if (!tabelaBody) return;

    if (produtos.length === 0) {
        tabelaBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted py-4">
                    Nenhum produto encontrado.
                </td>
            </tr>`;
        return;
    }

    tabelaBody.innerHTML = produtos.map(p => `
        <tr>
            <td>${p.nome}</td>
            <td>${p.categoria}</td>
            <td>${Number(p.preco).toFixed(2)} €</td>
            <td>${p.stockDisponivel}</td>
            <td>
                <a href="/supermercado/produtos/${p._id}" class="btn btn-sm btn-outline-primary">Ver</a>
                <a href="/supermercado/produtos/editar/${p._id}" class="btn btn-sm btn-outline-secondary">Editar</a>
            </td>
        </tr>
    `).join('');
}

if (inputPesquisa) {
    let timer;
    inputPesquisa.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(pesquisarProdutos, 300);
    });
}

if (selectCategoria) {
    selectCategoria.addEventListener('change', pesquisarProdutos);
}
