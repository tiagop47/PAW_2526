document.addEventListener('DOMContentLoaded', function () {
    const seletorRole = document.getElementById('seletor-role');
    const camposSuper = document.getElementById('campos-supermercado');

    if (!seletorRole || !camposSuper) {
        return;
    }

    const atualizarVisibilidadeCampos = function () {
        if (seletorRole.value === 'supermercados') {
            camposSuper.style.display = 'flex';
        } else {
            camposSuper.style.display = 'none';
        }
    };

    seletorRole.addEventListener('change', atualizarVisibilidadeCampos);
    atualizarVisibilidadeCampos();
});
