document.addEventListener('DOMContentLoaded', function () {
    const tabelaCorpo = document.querySelector('#tabelaProdutosVenda tbody');
    const formVenda = document.getElementById('formVendaCaixa');
    const hiddenItens = document.getElementById('itensVenda');
    const quantidadesSelecionadas = {};

    function atualizarQuantidadeSelecionada(input) {
        const produtoId = input.dataset.produtoId;
        const maximo = parseInt(input.max, 10);
        let qtd = parseInt(input.value, 10);

        if (!Number.isFinite(qtd) || qtd < 0) qtd = 0;
        if (Number.isFinite(maximo) && qtd > maximo) qtd = maximo;

        input.value = qtd;
        quantidadesSelecionadas[produtoId] = qtd;
    }

    if (tabelaCorpo) {
        tabelaCorpo.querySelectorAll('.js-quantidade').forEach(input => {
            atualizarQuantidadeSelecionada(input);
        });

        tabelaCorpo.addEventListener('input', function (event) {
            if (event.target.classList.contains('js-quantidade')) {
                atualizarQuantidadeSelecionada(event.target);
            }
        });
    }

    if (typeof inicializarPesquisaProdutos === 'function') {
        inicializarPesquisaProdutos({
            pagina: 'venda',
            endpoint: '/supermercado/api/produtos',
            debounceMs: 250,
            montarParams: ({ texto, categoria }) => {
                const params = new URLSearchParams();
                if (texto) params.set('q', texto);
                if (categoria) params.set('categoria', categoria);
                return params;
            },
            renderTabela: (produtos, tabelaBody) => {
                if (!Array.isArray(produtos) || produtos.length === 0) {
                    tabelaBody.innerHTML = `
                        <tr>
                            <td colspan="4" class="text-center text-muted py-3">Sem produtos com stock disponível.</td>
                        </tr>`;
                    return;
                }

                tabelaBody.innerHTML = produtos.map(produto => {
                    const quantidadeAtual = Number(quantidadesSelecionadas[produto._id] || 0);
                    return `
                        <tr>
                            <td>${produto.nome}</td>
                            <td>${Number(produto.preco || 0).toFixed(2)}EUR</td>
                            <td>${produto.stockDisponivel}</td>
                            <td style="max-width: 120px;">
                                <input type="number" min="0" max="${produto.stockDisponivel}" value="${Math.min(quantidadeAtual, produto.stockDisponivel)}"
                                    class="form-control form-control-sm js-quantidade"
                                    data-produto-id="${produto._id}">
                            </td>
                        </tr>`;
                }).join('');

                tabelaBody.querySelectorAll('.js-quantidade').forEach(input => {
                    atualizarQuantidadeSelecionada(input);
                });
            }
        });
    }

    const metodoEntregaSelect = document.getElementById('metodoEntregaVenda');
    const moradaInput = document.getElementById('moradaVenda');
    const labelMorada = document.getElementById('labelMorada');
    const hintMorada = document.getElementById('hintMorada');

    if (metodoEntregaSelect) {
        metodoEntregaSelect.addEventListener('change', function () {
            if (this.value === 'entrega ao domicilio') {
                labelMorada.innerHTML = 'Morada de Destino <span class="text-danger">*</span>';
                moradaInput.required = true;
                hintMorada.textContent = "Obrigatória para entregas por estafeta.";
            } else {
                labelMorada.textContent = 'Morada de Destino';
                moradaInput.required = false;
                hintMorada.textContent = "Obrigatória apenas para entregas ao domicílio.";
            }
        });
    }

/**
 * Processamento do formulário antes do envio com verificação de stock em tempo real
 */
if (formVenda) {
    formVenda.addEventListener('submit', async function (e) {
        e.preventDefault(); // Parar o envio para verificar stock

        // Validação extra da morada se for entrega
        if (metodoEntregaSelect.value === 'entrega ao domicilio' && !moradaInput.value.trim()) {
            alert('A morada de destino é obrigatória para encomendas a serem entregues por estafeta.');
            moradaInput.focus();
            return;
        }

            const itensParaEnviar = Object.entries(quantidadesSelecionadas)
                .filter(([, qtd]) => parseInt(qtd, 10) > 0)
                .map(([produtoId, qtd]) => ({
                    produtoId,
                    quantidade: parseInt(qtd, 10)
                }));

            if (itensParaEnviar.length === 0) {
                alert('Por favor, adicione pelo menos um produto com quantidade superior a 0.');
                return;
            }

            try {
                // Verificar stock no servidor antes de prosseguir
                const response = await fetch('/supermercado/api/verificar-stock', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ itens: itensParaEnviar })
                });

                const data = await response.json();

                if (!data.sucesso) {
                    let mensagem = "Erro de Stock:\n";
                    data.resultados.filter(r => r.erro).forEach(r => {
                        mensagem += `- ${r.nome}: apenas ${r.disponivel} disponíveis.\n`;
                    });
                    alert(mensagem + "\nA página será recarregada para atualizar o stock.");
                    location.reload();
                    return;
                }

                // Se o stock estiver OK, finaliza o envio
                hiddenItens.value = JSON.stringify(itensParaEnviar);
                formVenda.submit(); // Agora sim, envia o formulário

            } catch (err) {
                console.error("Erro na verificação de stock:", err);
                alert("Não foi possível verificar o stock. Tente novamente.");
            }
        });
    }
});
