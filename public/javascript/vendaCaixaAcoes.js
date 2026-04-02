const ENTREGA_DOMICILIO = 'entrega ao domicilio';
const SEM_COORDS = 'Nenhuma coordenada selecionada.';
const quantidadesSelecionadas = {};

const tabelaCorpo = document.querySelector('#tabelaProdutosVenda tbody');
const formVenda = document.getElementById('formVendaCaixa');
const hiddenItens = document.getElementById('itensVenda');
const metodoEntregaSelect = document.getElementById('metodoEntregaVenda');
const moradaInput = document.getElementById('moradaVenda');
const labelMorada = document.getElementById('labelMorada');
const hintMorada = document.getElementById('hintMorada');
const latitudeEntregaInput = document.getElementById('latitudeEntrega');
const longitudeEntregaInput = document.getElementById('longitudeEntrega');
const coordsSelecionadas = document.getElementById('coordsSelecionadas');

let mapaEntrega;
let marcadorEntrega = null;

function atualizarQuantidadeSelecionada(input) {
    const produtoId = input.dataset.produtoId;
    const maximo = parseInt(input.max, 10);
    let qtd = parseInt(input.value, 10);

    if (!Number.isFinite(qtd) || qtd < 0) qtd = 0;
    if (Number.isFinite(maximo) && qtd > maximo) qtd = maximo;

    input.value = qtd;
    quantidadesSelecionadas[produtoId] = qtd;
}

function inicializarTabelaQuantidades() {
    tabelaCorpo.querySelectorAll('.js-quantidade').forEach((input) => {
        atualizarQuantidadeSelecionada(input);
    });

    tabelaCorpo.addEventListener('input', function (event) {
        if (!event.target.classList.contains('js-quantidade')) return;
        atualizarQuantidadeSelecionada(event.target);
    });
}

function renderizarTabelaProdutos(produtos, tabelaBody) {
    if (!Array.isArray(produtos) || produtos.length === 0) {
        tabelaBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted py-3">Sem produtos com stock disponível.</td>
            </tr>`;
        return;
    }

    tabelaBody.innerHTML = produtos.map((produto) => {
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

    tabelaBody.querySelectorAll('.js-quantidade').forEach((input) => {
        atualizarQuantidadeSelecionada(input);
    });
}

function inicializarPesquisa() {
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
        renderTabela: renderizarTabelaProdutos
    });
}

function limparCoordenadasEntrega() {
    latitudeEntregaInput.value = '';
    longitudeEntregaInput.value = '';
    coordsSelecionadas.textContent = SEM_COORDS;

    if (!marcadorEntrega) return;
    mapaEntrega.removeLayer(marcadorEntrega);
    marcadorEntrega = null;
}

function atualizarUIEntrega() {
    const entregaDomicilio = metodoEntregaSelect.value === ENTREGA_DOMICILIO;

    if (entregaDomicilio) {
        labelMorada.innerHTML = 'Morada de Destino <span class="text-danger">*</span>';
        moradaInput.required = true;
        hintMorada.textContent = 'Obrigatória para entregas por estafeta.';
        return;
    }

    labelMorada.textContent = 'Morada de Destino';
    moradaInput.required = false;
    hintMorada.textContent = 'Obrigatória apenas para entregas ao domicílio.';
    limparCoordenadasEntrega();
}

function inicializarMapaEntrega() {
    mapaEntrega = L.map('mapaEscolherEntrega').setView([41.1579, -8.6291], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(mapaEntrega);

    mapaEntrega.on('click', function (event) {
        if (metodoEntregaSelect.value !== ENTREGA_DOMICILIO) return;

        const { lat, lng } = event.latlng;
        const latFinal = lat.toFixed(6);
        const lngFinal = lng.toFixed(6);

        latitudeEntregaInput.value = latFinal;
        longitudeEntregaInput.value = lngFinal;
        coordsSelecionadas.textContent = `Coordenadas selecionadas: ${latFinal}, ${lngFinal}`;

        if (!marcadorEntrega) {
            marcadorEntrega = L.marker([lat, lng]).addTo(mapaEntrega);
            return;
        }

        marcadorEntrega.setLatLng([lat, lng]);
    });
}

function obterItensSelecionados() {
    return Object.entries(quantidadesSelecionadas)
        .filter(([, qtd]) => parseInt(qtd, 10) > 0)
        .map(([produtoId, qtd]) => ({
            produtoId,
            quantidade: parseInt(qtd, 10)
        }));
}

async function validarStock(itens) {
    const response = await fetch('/supermercado/api/verificar-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itens })
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

    if (!validarFormulario()) return;

    const itensParaEnviar = obterItensSelecionados();
    if (itensParaEnviar.length === 0) {
        alert('Por favor, adicione pelo menos um produto com quantidade superior a 0.');
        return;
    }

    try {
        const data = await validarStock(itensParaEnviar);

        if (!data.sucesso) {
            let mensagem = 'Erro de Stock:\n';
            data.resultados.filter((r) => r.erro).forEach((r) => {
                mensagem += `- ${r.nome}: apenas ${r.disponivel} disponíveis.\n`;
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

inicializarTabelaQuantidades();
inicializarPesquisa();
inicializarMapaEntrega();

metodoEntregaSelect.addEventListener('change', atualizarUIEntrega);
metodoEntregaSelect.dispatchEvent(new Event('change'));

formVenda.addEventListener('submit', submeterVendaComValidacoes);
