function verificarCodigoLevantamento(formId) {
    const codigo = prompt("Por favor, peca ao cliente o CODIGO DE LEVANTAMENTO (6 digitos):");
    if (codigo === null) {
        return;
    }

    if (!/^\d{6}$/.test(codigo)) {
        alert("O codigo deve ter exatamente 6 digitos numericos.");
        return;
    }

    const form = document.getElementById(formId);
    if (!form) {
        return;
    }

    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "codigoVerificacao";
    input.value = codigo;
    form.appendChild(input);
    form.submit();
}
