
const formCriar = document.getElementById('formCriar');
const formEditar = document.getElementById('formEditar');

const nomeInput = document.getElementById('nome');
const precoInput = document.getElementById('preco');
const stockInput = document.getElementById('stockDisponivel');
const precoAntigoInput = document.getElementById('precoAntigo');
const imagemInput = document.getElementById('imagem');
const codigoBarrasInput = document.getElementById('codigoBarras');

/**
 * Calcula a percentagem de desconto.
 */
function calcularPercentagemDesconto(preco, precoAntigo) {
    const p = parseFloat(preco);
    const pa = parseFloat(precoAntigo);

    if (isNaN(p) || isNaN(pa) || pa <= p || pa <= 0) {
        return 0;
    }

    return Math.round(((pa - p) / pa) * 100);
}

/**
 * Atualiza a previsão de desconto no formulário.
 */
function atualizarPrevisaoDesconto() {
    const preview = document.getElementById('previsaoDesconto');
    if (!preview || !precoInput || !precoAntigoInput) return;

    const percentagem = calcularPercentagemDesconto(precoInput.value, precoAntigoInput.value);

    if (percentagem > 0) {
        preview.innerHTML = `<span class="badge bg-success bg-opacity-10 text-success border-0 small">Desconto de ${percentagem}% detetado</span>`;
    } else {
        preview.innerHTML = '';
    }
}

/**
 * Procura por elementos de detalhes e preenche o desconto automaticamente.
 */
function preencherDescontosPagina() {
    const elemento = document.getElementById('percentagemDesconto');
    if (!elemento) return;

    const p = elemento.getAttribute('data-preco');
    const pa = elemento.getAttribute('data-preco-antigo');
    
    const percentagem = calcularPercentagemDesconto(p, pa);
    if (percentagem > 0) {
        elemento.innerText = percentagem + '%';
    }
}

function validarFormularioProduto(form) {
    let erro = false;

    if (nomeInput && nomeInput.value.trim().length < 2) {
        alert('O nome do produto deve ter pelo menos 2 caracteres.');
        erro = true;
    }

    if (codigoBarrasInput && codigoBarrasInput.value.trim().length > 0 && codigoBarrasInput.value.trim().length < 9) {
        alert('O código de barras deve ter pelo menos 9 caracteres.');
        erro = true;
    }

    const p = parseFloat(precoInput?.value);
    const pa = parseFloat(precoAntigoInput?.value);

    if (isNaN(p) || p <= 0) {
        alert('O preço deve ser superior a 0.');
        erro = true;
    }

    if (!isNaN(pa) && pa > 0 && pa <= p) {
        alert('O preço antigo deve ser superior ao preço atual para ser uma promoção.');
        erro = true;
    }

    if (form.id === 'formCriar' && imagemInput && imagemInput.files.length === 0) {
        alert('A imagem do produto é obrigatória.');
        erro = true;
    }

    return !erro;
}

document.addEventListener('DOMContentLoaded', () => {
    preencherDescontosPagina();

    if (precoInput && precoAntigoInput) {
        precoInput.addEventListener('input', atualizarPrevisaoDesconto);
        precoAntigoInput.addEventListener('input', atualizarPrevisaoDesconto);
        atualizarPrevisaoDesconto(); 
    }

    if (formCriar) {
        formCriar.addEventListener('submit', (e) => {
            if (!validarFormularioProduto(formCriar)) e.preventDefault();
        });
    }

    if (formEditar) {
        formEditar.addEventListener('submit', (e) => {
            if (!validarFormularioProduto(formEditar)) e.preventDefault();
        });
    }
});
