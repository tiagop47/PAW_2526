const seletorRole = document.getElementById('seletor-role');
const camposSuper = document.getElementById('campos-supermercado');

const atualizarVisibilidadeCampos = function () {
    if (!seletorRole || !camposSuper) {
        return;
    }

    if (seletorRole.value === 'supermercados') {
        camposSuper.style.display = 'flex';
    } else {
        camposSuper.style.display = 'none';
    }
};

if (seletorRole && camposSuper) {
    seletorRole.addEventListener('change', atualizarVisibilidadeCampos);
    atualizarVisibilidadeCampos();
}
