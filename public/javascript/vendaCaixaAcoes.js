const ENTREGA_DOMICILIO = 'entrega ao domicilio';
const SEM_COORDS = 'Nenhuma coordenada selecionada.';

const carrinhoDeCompras = {};

const tabelaCarrinhoBody = document.getElementById('tabelaCarrinhoBody');
const formVenda = document.getElementById('formVendaCaixa');
const hiddenItens = document.getElementById('itensVenda');
const metodoEntregaSelect = document.getElementById('metodoEntregaVenda');
const moradaInput = document.getElementById('moradaVenda');
const labelMorada = document.getElementById('labelMorada');
const hintMorada = document.getElementById('hintMorada');
const latitudeEntregaInput = document.getElementById('latitudeEntrega');
const longitudeEntregaInput = document.getElementById('longitudeEntrega');
const coordsSelecionadas = document.getElementById('coordsSelecionadas');
const mapaEntregaElemento = document.getElementById('mapaEscolherEntrega');

let mapaEntrega;
let marcadorEntrega = null;


function renderizarResultadosModal(produtos, tabelaBody) {
    if (!Array.isArray(produtos) || produtos.length === 0) {
        tabelaBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">Nenhum produto encontrado.</td></tr>';
        return;
    }

    tabelaBody.innerHTML = produtos.map(function(produto) {
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
                        <button type="button" class="btn btn-primary" onclick="adicionarAoCarrinho('${produto._id}', '${nomeEscaped}', ${produto.preco}, ${produto.stockDisponivel}, event)">
                            Inserir
                        </button>
                    </div>
                </td>
            </tr>`;
    }).join('');
}

window.adicionarAoCarrinho = function(id, nome, preco, stock, event) {
    const inputQtd = document.getElementById(`qtd_modal_${id}`);
    const qtdPedida = parseInt(inputQtd.value, 10);
    
    if (isNaN(qtdPedida) || qtdPedida <= 0) {
        return;
    }

    if (!carrinhoDeCompras[id]) {
        carrinhoDeCompras[id] = { 
            nome: nome, 
            preco: preco, 
            stock: stock, 
            qtd: 0 
        };
    }
    
    let novaQtd = carrinhoDeCompras[id].qtd + qtdPedida;
    
    if (novaQtd > stock) {
        novaQtd = stock;
    }
    carrinhoDeCompras[id].qtd = novaQtd;

    if (event && event.currentTarget) {
        const btn = event.currentTarget;
        const textoOriginal = btn.innerHTML;
        btn.innerHTML = 'Adicionado';

        setTimeout(function() {
            btn.innerHTML = textoOriginal; 
        }, 600);
    }

    atualizarCarrinhoDOM();
    };


window.removerDoCarrinho = function(id) {
    delete carrinhoDeCompras[id];
    atualizarCarrinhoDOM();
};

window.mudarQuantidadeCarrinho = function(id, inputElement) {
    const newVal = parseInt(inputElement.value, 10);
    
    if (!carrinhoDeCompras[id]) {
        return;
    }
    
    if (isNaN(newVal) || newVal <= 0) {
        removerDoCarrinho(id);
        return;
    }

    let qtdFinal = newVal;
    
    if (qtdFinal > carrinhoDeCompras[id].stock) {
        qtdFinal = carrinhoDeCompras[id].stock;
    }
    
    carrinhoDeCompras[id].qtd = qtdFinal;
    atualizarCarrinhoDOM();
}

function atualizarCarrinhoDOM() {
    const chavesId = Object.keys(carrinhoDeCompras);
    
    if (chavesId.length === 0) {
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
    
    chavesId.forEach(function(id) {
        const produtoNoCarrinho = carrinhoDeCompras[id];
        const totalLinha = produtoNoCarrinho.preco * produtoNoCarrinho.qtd;
        totalGlobal = totalGlobal + totalLinha;
        
        htmlCarrinho += `
            <tr>
                <td><div class="fw-bold">${produtoNoCarrinho.nome}</div></td>
                <td>${Number(produtoNoCarrinho.preco || 0).toFixed(2)}€</td>
                <td>
                    <input type="number" min="1" max="${produtoNoCarrinho.stock}" value="${produtoNoCarrinho.qtd}"
                           class="form-control form-control-sm text-center" style="max-width: 80px;"
                           onchange="mudarQuantidadeCarrinho('${id}', this)"
                           onkeyup="mudarQuantidadeCarrinho('${id}', this)">
                </td>
                <td class="text-end fw-bold">${totalLinha.toFixed(2)}€</td>
                <td class="text-end">
                    <button type="button" class="btn btn-sm btn-outline-danger" onclick="removerDoCarrinho('${id}')" title="Remover">&times;</button>
                </td>
            </tr>`;
    });
    
    htmlCarrinho += `
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
    latitudeEntregaInput.value = '';
    longitudeEntregaInput.value = '';
    coordsSelecionadas.textContent = SEM_COORDS;
    
    if (marcadorEntrega) {
        mapaEntrega.removeLayer(marcadorEntrega);
        marcadorEntrega = null;
    }
}

function atualizarUIEntrega() {
    const entregaDomicilio = metodoEntregaSelect.value === ENTREGA_DOMICILIO;

    if (entregaDomicilio) {
        labelMorada.innerHTML = 'Morada de Destino <span class="text-danger">*</span>';
        moradaInput.required = true;
        hintMorada.textContent = 'Obrigatória para entregas por estafeta.';
        
        if (mapaEntrega) {
            requestAnimationFrame(function() {
                mapaEntrega.invalidateSize();
            });
        }
    } else {
        labelMorada.textContent = 'Morada de Destino';
        moradaInput.required = false;
        hintMorada.textContent = 'Obrigatória apenas para entregas ao domicílio.';
        limparCoordenadasEntrega();
    }
}

function inicializarMapaEntrega() {
    const latSuper = Number(mapaEntregaElemento?.dataset.superLat);
    const lngSuper = Number(mapaEntregaElemento?.dataset.superLng);
    const raioSuperKm = Number(mapaEntregaElemento?.dataset.superRaio || 5);
    const temCoordenadasSuper = Number.isFinite(latSuper) && Number.isFinite(lngSuper);

    let latInicial = 41.1579;
    let lngInicial = -8.6291;
    
    if (temCoordenadasSuper) {
        latInicial = latSuper;
        lngInicial = lngSuper;
    }

    mapaEntrega = inicializarMapa('mapaEscolherEntrega', latInicial, lngInicial);

    if (temCoordenadasSuper) {
        L.marker([latSuper, lngSuper]).addTo(mapaEntrega).bindPopup("<b>Supermercado</b>");
        
        const circuloAtuacao = L.circle([latSuper, lngSuper], {
            color: '#007bff', 
            fillColor: '#007bff', 
            fillOpacity: 0.1, 
            radius: (raioSuperKm * 1000) / 5
        }).addTo(mapaEntrega);
        
        mapaEntrega.fitBounds(circuloAtuacao.getBounds(), { padding: [30, 30] });
    }

    mapaEntrega.on('click', function (event) {
        if (metodoEntregaSelect.value !== ENTREGA_DOMICILIO) {
            return;
        }
        
        const lat = event.latlng.lat;
        const lng = event.latlng.lng;
        
        latitudeEntregaInput.value = lat.toFixed(6);
        longitudeEntregaInput.value = lng.toFixed(6);
        coordsSelecionadas.textContent = `Coordenadas selecionadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;

        if (!marcadorEntrega) {
            marcadorEntrega = L.marker([lat, lng]).addTo(mapaEntrega);
        } else {
            marcadorEntrega.setLatLng([lat, lng]);
        }
    });
}

function obterItensSelecionados() {
    const itensArray = [];
    const chavesId = Object.keys(carrinhoDeCompras);
    
    chavesId.forEach(function(id) {
        const p = carrinhoDeCompras[id];
        itensArray.push({
            produtoId: id,
            quantidade: p.qtd
        });
    });
    
    return itensArray;
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
    const entregaDomicilio = metodoEntregaSelect.value === ENTREGA_DOMICILIO;

    if (entregaDomicilio && !moradaInput.value.trim()) {
        alert('A morada de destino é obrigatória para encomendas a serem entregues por estafeta.');
        moradaInput.focus();
        return false;
    }

    if (entregaDomicilio && (!latitudeEntregaInput.value || !longitudeEntregaInput.value)) {
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
            
            data.resultados.forEach(function(r) {
                if (r.erro) {
                    mensagem += `- ${r.nome}: apenas ${r.disponivel} disponíveis.\n`;
                }
            });
            
            alert(`${mensagem}\nA página será recarregada para atualizar o stock.`);
            location.reload();
            return;
        }

        hiddenItens.value = JSON.stringify(itensParaEnviar);
        formVenda.submit();
        
    } catch (err) {
        console.error('Erro na verificação de stock:', err);
        alert('Não foi possível verificar o stock. Tente novamente.');
    }
}

inicializarPesquisa();
inicializarMapaEntrega();

metodoEntregaSelect.addEventListener('change', atualizarUIEntrega);
metodoEntregaSelect.dispatchEvent(new Event('change'));

formVenda.addEventListener('submit', submeterVendaComValidacoes);
