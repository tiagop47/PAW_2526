const ENTREGA_DOMICILIO = 'entrega ao domicilio';
const SEM_COORDS = 'Nenhuma coordenada selecionada.';

const formVendaCaixa = document.getElementById('formVendaCaixa');
const tabelaCarrinhoBody = document.getElementById('tabelaCarrinhoBody');
const hiddenItensVenda = document.getElementById('itensVenda');
const selectMetodoEntrega = document.getElementById('metodoEntregaVenda');
const inputMoradaVenda = document.getElementById('moradaVenda');
const labelMoradaVenda = document.getElementById('labelMorada');
const hintMoradaVenda = document.getElementById('hintMorada');
const inputLatitudeEntrega = document.getElementById('latitudeEntrega');
const inputLongitudeEntrega = document.getElementById('longitudeEntrega');
const textoCoordsSelecionadas = document.getElementById('coordsSelecionadas');
const elMapaEntrega = document.getElementById('mapaEscolherEntrega');
const tabelaPesquisaModalBody = document.querySelector('[data-produto-pesquisa="tabela"]');

const carrinhoDeCompras = [];

let mapaInstancia;
let marcadorEntregaInstancia = null;
let ultimosProdutosPesquisa = [];

function obterQtdNoCarrinho(produtoId) {
    const item = carrinhoDeCompras.find(i => i.id === produtoId);
    return item ? item.qtd : 0;
}

function renderizarResultadosModal(produtos, tabelaBody) {
    if (!Array.isArray(produtos) || produtos.length === 0) {
        tabelaBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Nenhum produto encontrado.</td></tr>';
        return;
    }

    ultimosProdutosPesquisa = produtos;

    tabelaBody.innerHTML = produtos.map(function (produto) {
        const qtdAtual = obterQtdNoCarrinho(produto._id);

        if (produto.stockDisponivel <= 0) {
            return `
            <tr>
                <td><div class="fw-bold">${produto.nome}</div></td>
                <td><svg class="barcode-modal" data-barcode-id="${produto._id}"></svg></td>
                <td>${Number(produto.preco || 0).toFixed(2)}€</td>
                <td class="text-danger">Sem Stock</td>
                <td class="text-center text-muted">Indisponível</td>
            </tr>`;
        }

        const nomeEscaped = produto.nome.replace(/'/g, "\\'");

        return `
            <tr>
                <td><div class="fw-bold">${produto.nome}</div></td>
                <td><svg class="barcode-modal" data-barcode-id="${produto._id}"></svg></td>
                <td>${Number(produto.preco || 0).toFixed(2)}€</td>
                <td>${produto.stockDisponivel}</td>
                <td style="min-width: 140px;">
                    <div class="d-flex align-items-center justify-content-center gap-2">
                        <button type="button" class="btn btn-sm btn-outline-secondary js-modal-menos" 
                                data-id="${produto._id}"
                                ${qtdAtual <= 0 ? 'disabled' : ''}>−</button>
                        <span class="fw-bold" style="min-width: 24px; text-align: center;">${qtdAtual}</span>
                        <button type="button" class="btn btn-sm btn-primary js-modal-mais" 
                                data-id="${produto._id}" 
                                data-nome="${nomeEscaped}" 
                                data-preco="${produto.preco}" 
                                data-stock="${produto.stockDisponivel}"
                                ${qtdAtual >= produto.stockDisponivel ? 'disabled' : ''}>+</button>
                    </div>
                </td>
            </tr>`;
    }).join('');

    document.querySelectorAll('.barcode-modal').forEach(function (svg) {
        const produtoId = svg.getAttribute('data-barcode-id');
        if (produtoId && typeof JsBarcode !== 'undefined') {
            JsBarcode(svg, produtoId, {
                format: 'CODE128',
                width: 1,
                height: 30,
                displayValue: false,
                margin: 2
            });
        }
    });
}

function adicionarUmAoCarrinho(id, nome, preco, stock) {
    const itemExistente = carrinhoDeCompras.find(item => item.id === id);

    if (itemExistente) {
        if (itemExistente.qtd < stock) {
            itemExistente.qtd += 1;
        }
    } else {
        carrinhoDeCompras.push({
            id: id,
            nome: nome,
            preco: preco,
            stock: stock,
            qtd: 1
        });
    }

    atualizarCarrinhoDOM();
    if (ultimosProdutosPesquisa.length > 0) {
        renderizarResultadosModal(ultimosProdutosPesquisa, tabelaPesquisaModalBody);
    }
}

function removerUmDoCarrinho(id) {
    const itemExistente = carrinhoDeCompras.find(item => item.id === id);

    if (itemExistente) {
        itemExistente.qtd -= 1;
        if (itemExistente.qtd <= 0) {
            const index = carrinhoDeCompras.indexOf(itemExistente);
            carrinhoDeCompras.splice(index, 1);
        }
    }

    atualizarCarrinhoDOM();
    if (ultimosProdutosPesquisa.length > 0) {
        renderizarResultadosModal(ultimosProdutosPesquisa, tabelaPesquisaModalBody);
    }
}

function removerDoCarrinho(id) {
    const index = carrinhoDeCompras.findIndex(item => item.id === id);

    if (index !== -1) {
        carrinhoDeCompras.splice(index, 1);
    }

    atualizarCarrinhoDOM();
}

if (tabelaPesquisaModalBody) {
    tabelaPesquisaModalBody.addEventListener('click', function (e) {
        const btnMais = e.target.closest('.js-modal-mais');
        if (btnMais) {
            const { id, nome, preco, stock } = btnMais.dataset;
            adicionarUmAoCarrinho(id, nome, parseFloat(preco), parseInt(stock, 10));
        }

        const btnMenos = e.target.closest('.js-modal-menos');
        if (btnMenos) {
            removerUmDoCarrinho(btnMenos.dataset.id);
        }
    });
}

if (tabelaCarrinhoBody) {
    tabelaCarrinhoBody.addEventListener('click', function (e) {
        const btnRemover = e.target.closest('.js-remover');
        if (btnRemover) {
            removerDoCarrinho(btnRemover.dataset.id);
        }
    });
}

function atualizarCarrinhoDOM() {
    if (carrinhoDeCompras.length === 0) {
        tabelaCarrinhoBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted py-5">
                    Ainda não adicionaste produtos.<br>
                    <small>Clica em "Adicionar Produtos" para começares a venda.</small>
                </td>
            </tr>`;
        return;
    }

    let totalGlobal = 0;
    let htmlCarrinho = "";

    carrinhoDeCompras.forEach(function (produto) {
        const totalLinha = produto.preco * produto.qtd;
        totalGlobal += totalLinha;

        htmlCarrinho += `
            <tr>
                <td><div class="fw-bold">${produto.nome}</div></td>
                <td>${Number(produto.preco || 0).toFixed(2)}€</td>
                <td class="text-center">
                    <span class="badge bg-light text-dark border px-3 py-2">${produto.qtd}</span>
                </td>
                <td class="text-end fw-bold">${totalLinha.toFixed(2)}€</td>
                <td class="text-end">
                    <button type="button" class="btn btn-sm btn-outline-danger js-remover" data-id="${produto.id}" title="Remover">&times;</button>
                </td>
            </tr>`;
    });

    const taxaIva = 0.23;
    const baseTribu = totalGlobal / (1 + taxaIva);
    const valorIva = totalGlobal - baseTribu;

    htmlCarrinho += `
        <tr class="table-light">
            <td colspan="3" class="text-end text-muted">Subtotal (s/ IVA):</td>
            <td colspan="2" class="text-end text-muted">${baseTribu.toFixed(2)}€</td>
        </tr>
        <tr class="table-light">
            <td colspan="3" class="text-end text-muted">IVA (${(taxaIva * 100).toFixed(0)}%):</td>
            <td colspan="2" class="text-end text-muted">${valorIva.toFixed(2)}€</td>
        </tr>
        <tr class="table-light">
            <td colspan="3" class="text-end fw-bold">Total a Pagar:</td>
            <td colspan="2" class="text-end fw-bold fs-5 text-dark">${totalGlobal.toFixed(2)}€</td>
        </tr>
    `;

    tabelaCarrinhoBody.innerHTML = htmlCarrinho;
}

function inicializarPesquisa() {
    const filtroPesquisa = inicializarPesquisaProdutos({
        debounceMs: 250,
        renderTabela: renderizarResultadosModal
    });

    if (filtroPesquisa && typeof filtroPesquisa.executarPesquisa === 'function') {
        filtroPesquisa.executarPesquisa();
    }
}

function limparCoordenadasEntrega() {
    inputLatitudeEntrega.value = '';
    inputLongitudeEntrega.value = '';
    textoCoordsSelecionadas.textContent = SEM_COORDS;

    if (marcadorEntregaInstancia) {
        mapaInstancia.removeLayer(marcadorEntregaInstancia);
        marcadorEntregaInstancia = null;
    }
}

function atualizarUIEntrega() {
    const entregaDomicilio = selectMetodoEntrega.value === ENTREGA_DOMICILIO;

    if (entregaDomicilio) {
        labelMoradaVenda.innerHTML = 'Morada de Destino <span class="text-danger">*</span>';
        inputMoradaVenda.required = true;
        hintMoradaVenda.textContent = 'Obrigatória para entregas por estafeta.';

        if (mapaInstancia) {
            requestAnimationFrame(function () {
                mapaInstancia.invalidateSize();
            });
        }
    } else {
        labelMoradaVenda.textContent = 'Morada de Destino';
        inputMoradaVenda.required = false;
        hintMoradaVenda.textContent = 'Obrigatória apenas para entregas ao domicílio.';
        limparCoordenadasEntrega();
    }
}

function inicializarMapaEntrega() {
    const latSuper = Number(elMapaEntrega?.dataset.superLat);
    const lngSuper = Number(elMapaEntrega?.dataset.superLng);
    const raioSuperKm = Number(elMapaEntrega?.dataset.superRaio || 5);
    const temCoordenadasSuper = Number.isFinite(latSuper) && Number.isFinite(lngSuper);

    let latInicial = 41.1579;
    let lngInicial = -8.6291;

    if (temCoordenadasSuper) {
        latInicial = latSuper;
        lngInicial = lngSuper;
    }

    mapaInstancia = inicializarMapa('mapaEscolherEntrega', latInicial, lngInicial);

    if (temCoordenadasSuper) {
        L.marker([latSuper, lngSuper]).addTo(mapaInstancia).bindPopup("<b>Supermercado</b>");

        const circuloAtuacao = L.circle([latSuper, lngSuper], {
            color: '#007bff',
            fillColor: '#007bff',
            fillOpacity: 0.1,
            radius: (raioSuperKm * 1000) / 5
        }).addTo(mapaInstancia);

        mapaInstancia.fitBounds(circuloAtuacao.getBounds(), { padding: [30, 30] });
    }

    mapaInstancia.on('click', function (event) {
        if (selectMetodoEntrega.value !== ENTREGA_DOMICILIO) {
            return;
        }

        const lat = event.latlng.lat;
        const lng = event.latlng.lng;

        inputLatitudeEntrega.value = lat.toFixed(6);
        inputLongitudeEntrega.value = lng.toFixed(6);
        textoCoordsSelecionadas.textContent = `Coordenadas selecionadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;

        if (!marcadorEntregaInstancia) {
            marcadorEntregaInstancia = L.marker([lat, lng]).addTo(mapaInstancia);
        } else {
            marcadorEntregaInstancia.setLatLng([lat, lng]);
        }
    });
}

function obterItensSelecionados() {
    return carrinhoDeCompras.map(item => ({
        produtoId: item.id,
        quantidade: item.qtd
    }));
}

async function validarStock(itens) {
    const response = await fetch('/supermercado/api/verificar-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itens: itens })
    });

    return response.json();
}

function validarFormulario() {
    const entregaDomicilio = selectMetodoEntrega.value === ENTREGA_DOMICILIO;

    if (entregaDomicilio && !inputMoradaVenda.value.trim()) {
        alert('A morada de destino é obrigatória para encomendas a serem entregues por estafeta.');
        inputMoradaVenda.focus();
        return false;
    }

    if (entregaDomicilio && (!inputLatitudeEntrega.value || !inputLongitudeEntrega.value)) {
        alert('Selecione no mapa as coordenadas da entrega.');
        return false;
    }

    return true;
}

async function submeterVendaComValidacoes(event) {
    event.preventDefault();

    if (!validarFormulario()) {
        return;
    }

    const itensParaEnviar = obterItensSelecionados();

    if (itensParaEnviar.length === 0) {
        alert('Por favor, adicione pelo menos um produto ao carrinho.');
        return;
    }

    try {
        const data = await validarStock(itensParaEnviar);

        if (!data.sucesso) {
            let mensagem = 'Erro de Stock:\n';

            data.resultados.forEach(function (r) {
                if (r.erro) {
                    mensagem += `- ${r.nome}: apenas ${r.disponivel} disponíveis.\n`;
                }
            });

            alert(`${mensagem}\nA página será recarregada para atualizar o stock.`);
            location.reload();
            return;
        }

        hiddenItensVenda.value = JSON.stringify(itensParaEnviar);
        formVendaCaixa.submit();

    } catch (err) {
        console.error('Erro na verificação de stock:', err);
        alert('Não foi possível verificar o stock. Tente novamente.');
    }
}

document.addEventListener('DOMContentLoaded', function () {
    inicializarPesquisa();
    inicializarMapaEntrega();

    if (selectMetodoEntrega) {
        selectMetodoEntrega.addEventListener('change', atualizarUIEntrega);
        atualizarUIEntrega();
    }

    if (formVendaCaixa) {
        formVendaCaixa.addEventListener('submit', submeterVendaComValidacoes);
    }
});
