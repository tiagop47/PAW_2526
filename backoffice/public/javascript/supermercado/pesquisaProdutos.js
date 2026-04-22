// Configurações Globais
const API_URL = '/supermercado/produtos/pesquisar';

// Seleção de elementos do DOM
const campoPesquisa = document.querySelector('[data-pesquisa="input"]');
const filtroCategoria = document.querySelector('[data-pesquisa="categoria"]');
const tabelaProdutos = document.querySelector('[data-pesquisa="tabela"]');

// Função para desenhar a tabela padrão (Gestão de Produtos)
function desenharTabelaPadrao(dados) {
    if (!tabelaProdutos) return;
    const lista = dados.produtos || [];

    if (lista.length === 0) {
        tabelaProdutos.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">Nenhum produto encontrado.</td></tr>';
        desenharPaginacao(0, 0);
        return;
    }

    tabelaProdutos.innerHTML = lista.map(p => `
        <tr>
            <td class="fw-bold">${p.nome}</td>
            <td><span class="badge border text-dark fw-normal">${p.categoriaId ? p.categoriaId.nome : '—'}</span></td>
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

    desenharPaginacao(dados.paginaAtual, dados.totalPaginas);
}

// Função para gerir os botões de página
function desenharPaginacao(atual, total) {
    let blocoPaginacao = document.getElementById('bloco-paginacao-pesquisa');
    
    if (!blocoPaginacao) {
        blocoPaginacao = document.createElement('div');
        blocoPaginacao.id = 'bloco-paginacao-pesquisa';
        blocoPaginacao.className = 'd-flex justify-content-center align-items-center mt-3 gap-2';
        tabelaProdutos.closest('.table-responsive').after(blocoPaginacao);
    }

    if (total <= 1) {
        blocoPaginacao.innerHTML = '';
        return;
    }

    blocoPaginacao.innerHTML = `
        <button class="btn btn-sm btn-light border" ${atual === 1 ? 'disabled' : ''} data-pagina="${atual - 1}">Anterior</button>
        <span class="small text-muted">Página ${atual} de ${total}</span>
        <button class="btn btn-sm btn-light border" ${atual === total ? 'disabled' : ''} data-pagina="${atual + 1}">Próximo</button>
    `;
}

// Variável para armazenar a função de busca e permitir chamadas externas (como no modal)
let funcaoBuscarDados;

// Inicialização do motor de pesquisa
function inicializarPesquisaProdutos(renderPersonalizado) {
    if (!campoPesquisa || !filtroCategoria) return;

    const renderizar = renderPersonalizado || desenharTabelaPadrao;

    async function buscarDados(pagina = 1) {
        const texto = campoPesquisa.value.trim();
        const categoria = filtroCategoria.value;
        const query = `?q=${encodeURIComponent(texto)}&categoriaId=${categoria}&pagina=${pagina}`;

        try {
            const resposta = await fetch(API_URL + query);
            if (!resposta.ok) return;

            const dados = await resposta.json();
            renderizar(dados, tabelaProdutos);
        } catch (erro) {
            console.error('Erro na pesquisa:', erro);
        }
    }

    funcaoBuscarDados = buscarDados;

    // Delegação de eventos para a paginação
    document.addEventListener('click', (evento) => {
        const botao = evento.target.closest('[data-pagina]');
        if (botao && !botao.disabled) {
            buscarDados(parseInt(botao.dataset.pagina));
        }
    });

    let tempoEspera;
    campoPesquisa.addEventListener('input', () => {
        clearTimeout(tempoEspera);
        tempoEspera = setTimeout(() => buscarDados(1), 300);
    });

    filtroCategoria.addEventListener('change', () => buscarDados(1));

    return { executarPesquisa: buscarDados };
}
