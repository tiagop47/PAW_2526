const inputPesquisa = document.querySelector('[data-produto-pesquisa="input"]');
const selectCategoria = document.querySelector('[data-produto-pesquisa="categoria"]');
const tabelaBody = document.querySelector('[data-produto-pesquisa="tabela"]');

function atualizarTabela(produtos) {
    if (!tabelaBody) {
        return;
    }

    if (!Array.isArray(produtos) || produtos.length === 0) {
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

async function pesquisarProdutos() {
    const texto = inputPesquisa?.value.trim() || '';
    const categoria = selectCategoria?.value || '';

    //os parâmetros URL ?q=frango&categoria=talho
    const params = new URLSearchParams();
    if (texto) {
        params.set('q', texto);
    }
    if (categoria) {
        params.set('categoria', categoria);
    }

    const url = `/supermercado/api/produtos?${params.toString()}`;

    try {
        const resposta = await fetch(url);

        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }

        const produtos = await resposta.json();
        atualizarTabela(produtos);
    } catch (err) {
        console.error('Erro na pesquisa:', err);
    }
}

if (inputPesquisa && selectCategoria) {
    let tempoEspera;

    inputPesquisa.addEventListener('input', () => {
        clearTimeout(tempoEspera);
        tempoEspera = setTimeout(pesquisarProdutos, 300);
    });

    selectCategoria.addEventListener('change', pesquisarProdutos);
}
