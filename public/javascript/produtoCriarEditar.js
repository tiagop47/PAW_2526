// Seletores de Elementos (Topo do documento)
const formCriar = document.querySelector('#formCriar');
const formEditar = document.querySelector("#formEditar");
const formEliminar = document.querySelector("#formEliminar");

function validarFormularioProduto(form) {
    const campoNome = form.querySelector('[name="nome"]');
    const campoPreco = form.querySelector('[name="preco"]');
    const campoStock = form.querySelector('[name="stockDisponivel"]');
    const campoImagem = form.querySelector('[name="imagem"]');

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

if (formCriar) {
    formCriar.addEventListener('submit', tratarSubmit);
}
if (formEditar) {
    formEditar.addEventListener('submit', tratarSubmit);
}
if (formEliminar) {
    formEliminar.addEventListener('submit', tratarSubmitEliminar);
}
