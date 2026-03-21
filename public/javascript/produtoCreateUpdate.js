document.getElementById

const form = document.querySelector('form');
if (!form) return;

const campos = {
    nome: form.querySelector('[name="nome"]'),
    categoria: form.querySelector('[name="categoria"]'),
    preco: form.querySelector('[name="preco"]'),
    stock: form.querySelector('[name="stock"]'),
    descricao: form.querySelector('[name="descricao"]')
};

const regras = {
    nome: {
        validar: (valor) => valor.trim().length >= 2 && valor.trim().length <= 100,
        mensagem: 'O nome deve ter entre 2 e 100 caracteres.'
    },
    categoria: {
        validar: (valor) => valor && valor.trim().length >= 3,
        mensagem: 'Selecione uma categoria.'
    },
    preco: {
        validar: (valor) => !isNaN(valor) && parseFloat(valor) >= 0,
        mensagem: 'Introduza um preço válido (≥ 0).'
    },
    stock: {
        validar: (valor) => !isNaN(valor) && Number.isInteger(Number(valor)) && parseInt(valor) >= 0,
        mensagem: 'O stock deve ser um número inteiro positivo.'
    }
};

function addProduto() {

}
