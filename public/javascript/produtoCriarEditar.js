// Seletores de Elementos (Topo do documento)
var formCriar = document.querySelector('#formCriar');
var formEditar = document.querySelector("#formEditar");
var formEliminar = document.querySelector("#formEliminar");

function validarFormularioProduto(form) {
    var campoNome = form.querySelector('[name="nome"]');
    var campoPreco = form.querySelector('[name="preco"]');
    var campoStock = form.querySelector('[name="stockDisponivel"]');
    var campoImagem = form.querySelector('[name="imagem"]');

    var erro = false;

    if (campoNome.value.trim().length < 2) {
        userValidator.exibirErro(campoNome, 'Mínimo 2 caracteres.');
        erro = true;
    }
    if (campoPreco.value === '' || parseFloat(campoPreco.value) < 0) {
        userValidator.exibirErro(campoPreco, 'Preço inválido.');
        erro = true;
    }
    if (campoStock.value === '' || parseInt(campoStock.value, 10) < 0) {
        userValidator.exibirErro(campoStock, 'Stock inválido.');
        erro = true;
    }
    if (form.id === 'formCriar' && campoImagem && campoImagem.files.length === 0) {
        userValidator.exibirErro(campoImagem, 'Imagem obrigatória.');
        erro = true;
    }

    return !erro;
}

function tratarSubmit(e) {
    if (!validarFormularioProduto(e.target)) {
        e.preventDefault();
    }
}

function tratarSubmitEliminar(e) {
    if (!confirm('Deseja eliminar este produto?')) {
        e.preventDefault();
    }
}

// Event Listeners
if (formCriar) formCriar.addEventListener('submit', tratarSubmit);
if (formEditar) formEditar.addEventListener('submit', tratarSubmit);
if (formEliminar) formEliminar.addEventListener('submit', tratarSubmitEliminar);
