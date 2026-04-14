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


function renderizarResultadosModal(produtos, tabelaBody) {
    if (!Array.isArray(produtos) || produtos.length === 0) {
        tabelaBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">Nenhum produto encontrado.</td></tr>';
        return;
    }

    tabelaBody.innerHTML = produtos.map(function (produto) {
        if (produto.stockDisponivel <= 0) {
            return `
            <tr>
                <td><div class="fw-bold">${produto.nome}</div></td>
                <td>${Number(produto.preco || 0).toFixed(2)}€</td>
                <td class="text-danger">Sem Stock</td>
                <td><button type="button" class="btn btn-sm btn-outline-secondary w-100" disabled>Indisponível</button></td>
            </tr>`;
        }

        const nomeEscaped = produto.nome.replace(/'/g, "\\'");

        return `
            <tr>
                <td><div class="fw-bold">${produto.nome}</div></td>
                <td>${Number(produto.preco || 0).toFixed(2)}€</td>
                <td>${produto.stockDisponivel}</td>
                <td style="min-width: 160px;">
                    <div class="input-group input-group-sm">
                        <input type="number" id="qtd_modal_${produto._id}" min="1" max="${produto.stockDisponivel}" value="1" class="form-control text-center" style="max-width: 60px;">
                        <button type="button" class="btn btn-primary js-adicionar" 
                                data-id="${produto._id}" 
                                data-nome="${nomeEscaped}" 
                                data-preco="${produto.preco}" 
                                data-stock="${produto.stockDisponivel}">
                            Inserir
                        </button>
                    </div>
                </td>
            </tr>`;
    }).join('');
}

function adicionarAoCarrinho(id, nome, preco, stock, btn) {
    const inputQtd = document.getElementById(`qtd_modal_${id}`);
    const qtdPedida = parseInt(inputQtd.value, 10);

    if (isNaN(qtdPedida) || qtdPedida <= 0) {
        return;
    }

    const itemExistente = carrinhoDeCompras.find(item => item.id === id);

    if (itemExistente) {
        let novaQtd = itemExistente.qtd + qtdPedida;
        if (novaQtd > stock) novaQtd = stock;
        itemExistente.qtd = novaQtd;
    } else {
        carrinhoDeCompras.push({
            id: id,
            nome: nome,
            preco: preco,
            stock: stock,
            qtd: qtdPedida > stock ? stock : qtdPedida
        });
    }

    if (btn) {
        const textoOriginal = btn.innerHTML;
        btn.innerHTML = 'Adicionado';

        setTimeout(function () {
            btn.innerHTML = textoOriginal;
        }, 600);
    }

    atualizarCarrinhoDOM();
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
        const btn = e.target.closest('.js-adicionar');
        if (btn) {
            const { id, nome, preco, stock } = btn.dataset;
            adicionarAoCarrinho(id, nome, parseFloat(preco), parseInt(stock, 10), btn);
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
