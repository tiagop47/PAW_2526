const inputPesquisa = document.getElementById('pesquisa-produto');
const selectCategoria = document.getElementById('filtro-categoria');
const tabelaBody = document.getElementById('tabela-produtos');

const formCriar = document.getElementById('formCriar');
const formEditar = document.getElementById('formEditar');
const formVendaCaixa = document.getElementById('formVendaCaixa');
const itensVendaInput = document.getElementById('itensVenda');

let timerPesquisa;

const validarProdutoForm = function (form) {
    const nomeInput = form.querySelector('[name="nome"]');
    const precoInput = form.querySelector('[name="preco"]');
    const stockInput = form.querySelector('[name="stockDisponivel"]');

    const nome = nomeInput ? nomeInput.value.trim() : '';
    const preco = precoInput ? precoInput.value : '';
    const stockDisponivel = stockInput ? stockInput.value : '';

    const erros = [];

    if (nome.length < 2) {
        erros.push('O nome deve ter pelo menos 2 caracteres.');
    }

    if (preco === '' || Number(preco) < 0) {
        erros.push('O preço deve ser um valor positivo.');
    }

    if (stockDisponivel === '' || Number(stockDisponivel) < 0) {
        erros.push('O stock deve ser um número positivo.');
    }

    return erros;
};

const prepararValidacaoFormulario = function (form) {
    form.addEventListener('submit', function (e) {
        const erros = validarProdutoForm(form);
        if (erros.length > 0) {
            e.preventDefault();
            alert(erros.join('\n'));
        }
    });
};

if (formCriar) {
    prepararValidacaoFormulario(formCriar);
}

if (formEditar) {
    prepararValidacaoFormulario(formEditar);
}

const atualizarTabelaProdutos = function (produtos) {
    if (!tabelaBody) {
        return;
    }

    if (!Array.isArray(produtos) || produtos.length === 0) {
        tabelaBody.innerHTML = `<tr>
                        <td colspan="5" class="text-center text-muted py-4">
                        Nenhum produto encontrado.</td>
                            </tr>`;
        return;
    }

    const linhas = produtos.map(function (p) {
        return '<tr>' +
            '<td>' + (p.nome || '') + '</td>' +
            '<td>' + (p.categoria || '') + '</td>' +
            '<td>' + Number(p.preco || 0).toFixed(2) + ' EUR</td>' +
            '<td>' + Number(p.stockDisponivel || 0) + '</td>' +
            '<td>' +
            '</td>' +
            '</tr>';
    }).join('');

    tabelaBody.innerHTML = linhas;
};

const pesquisarProdutos = async function () {
    const params = new URLSearchParams();

    const texto = inputPesquisa && inputPesquisa.value ? inputPesquisa.value.trim() : '';
    const categoria = selectCategoria ? selectCategoria.value : '';

    if (texto) {
        params.set('q', texto);
    }

    if (categoria) {
        params.set('categoria', categoria);
    }

    try {
        const resposta = await fetch('/supermercado/api/produtos?' + params.toString());
        if (!resposta.ok) {
            throw new Error('Resposta inválida do servidor');
        }

        const produtos = await resposta.json();
        atualizarTabelaProdutos(produtos);
    } catch (err) {
        console.error('Erro na pesquisa de produtos:', err);
    }
};

if (inputPesquisa) {
    inputPesquisa.addEventListener('input', function () {
        clearTimeout(timerPesquisa);
        timerPesquisa = setTimeout(pesquisarProdutos, 300);
    });
}

if (selectCategoria) {
    selectCategoria.addEventListener('change', pesquisarProdutos);
}

if (formVendaCaixa) {
    formVendaCaixa.addEventListener('submit', function (e) {
        const inputs = formVendaCaixa.querySelectorAll('.js-quantidade');
        const itens = [];

        inputs.forEach(function (input) {
            const quantidade = Number(input.value || 0);
            if (quantidade > 0) {
                itens.push({
                    produtoId: input.dataset.produtoId,
                    quantidade: quantidade
                });
            }
        });

        if (itens.length === 0) {
            e.preventDefault();
            alert('Seleciona pelo menos um produto para registar a venda.');
            return;
        }

        if (itensVendaInput) {
            itensVendaInput.value = JSON.stringify(itens);
        }
    });
}
