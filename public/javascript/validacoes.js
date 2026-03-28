/**
 * Validações de formulário genéricas e específicas para o projeto.
 */
function validarEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function exibirErro(idCampo, mensagem) {
    const campo = document.getElementById(idCampo);
    if (!campo) return;

    // Remover erro antigo se houver
    const erroAntigo = campo.parentElement.querySelector('.invalid-feedback');
    if (erroAntigo) erroAntigo.remove();

    // Adicionar classe de erro do Bootstrap
    campo.classList.add('is-invalid');

    // Criar a div de mensagem
    const divErro = document.createElement('div');
    divErro.className = 'invalid-feedback';
    divErro.innerText = mensagem;
    campo.parentElement.appendChild(divErro);
}

function limparErro(idCampo) {
    const campo = document.getElementById(idCampo);
    if (campo) {
        campo.classList.remove('is-invalid');
        const erro = campo.parentElement.querySelector('.invalid-feedback');
        if (erro) erro.remove();
    }
}

// Escutar eventos de input para limpar erros enquanto o user escreve
document.addEventListener("input", function (e) {
    if (e.target.classList.contains('is-invalid')) {
        limparErro(e.target.id);
    }
});
