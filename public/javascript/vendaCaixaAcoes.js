document.addEventListener('DOMContentLoaded', function () {
    const pesquisaInput = document.getElementById('pesquisaProdutoVenda');
    const tabelaCorpo = document.querySelector('#tabelaProdutosVenda tbody');
    const formVenda = document.getElementById('formVendaCaixa');
    const hiddenItens = document.getElementById('itensVenda');

    /**
     * Filtro de pesquisa de produtos na tabela
     */
    if (pesquisaInput) {
        pesquisaInput.addEventListener('keyup', function () {
            const termo = pesquisaInput.value.toLowerCase();
            const linhas = tabelaCorpo.querySelectorAll('tr');

            linhas.forEach(linha => {
                const nomeProduto = linha.cells[0]?.textContent.toLowerCase();
                if (nomeProduto && nomeProduto.includes(termo)) {
                    linha.style.display = '';
                } else {
                    linha.style.display = 'none';
                }
            });
        });
    }

    /**
     * Processamento do formulário antes do envio
     */
    if (formVenda) {
        formVenda.addEventListener('submit', function (e) {
            const inputsQuantidade = document.querySelectorAll('.js-quantidade');
            const itensParaEnviar = [];

            inputsQuantidade.forEach(input => {
                const qtd = parseInt(input.value);
                if (qtd > 0) {
                    itensParaEnviar.push({
                        produtoId: input.dataset.produtoId,
                        quantidade: qtd
                    });
                }
            });

            if (itensParaEnviar.length === 0) {
                e.preventDefault();
                alert('Por favor, adicione pelo menos um produto com quantidade superior a 0.');
                return;
            }

            hiddenItens.value = JSON.stringify(itensParaEnviar);
        });
    }
});
