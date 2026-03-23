const formCriar = document.querySelector('#formCriar');
const formEditar = document.querySelector("#formEditar");
const formEliminar = document.querySelector("#formEliminar");

const validarFormularioProduto = function (form) {
    const nome = form.querySelector('[name="nome"]').value.trim();
    const preco = form.querySelector('[name="preco"]').value;
    const stock = form.querySelector('[name="stock"]').value;
    const erros = [];

    if (nome.length < 2) {
        erros.push('O nome deve ter pelo menos 2 caracteres.');
    }

    if (preco === '' || parseFloat(preco) < 0) {
        erros.push('O preço deve ser um valor positivo.');
    }

    if (stock === '' || parseInt(stock, 10) < 0) {
        erros.push('O stock deve ser um número positivo.');
    }

    return erros;
};

const tratarSubmitCriar = function (e) {
    const erros = validarFormularioProduto(formCriar);
    if (erros.length > 0) {
        e.preventDefault();
        alert(erros.join('\n'));
    }
};

const tratarSubmitEditar = function (e) {
    const erros = validarFormularioProduto(formEditar);
    if (erros.length > 0) {
        e.preventDefault();
        alert(erros.join('\n'));
    }
};

const tratarSubmitEliminar = function (e) {
    if (!confirm('Deseja eliminar este produto?')) {
        e.preventDefault();
    }
};

if (formCriar) {
    formCriar.addEventListener('submit', tratarSubmitCriar);
}

if (formEditar) {
    formEditar.addEventListener('submit', tratarSubmitEditar);
}

if (formEliminar) {
    formEliminar.addEventListener('submit', tratarSubmitEliminar);
}
