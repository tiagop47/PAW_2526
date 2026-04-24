const zonaSelectDashboard = document.getElementById('zonaTrabalhoDashboard');
const btnIrEntregasComZona = document.getElementById('btnIrEntregasComZona');
const linkEntregasDisponiveis = document.getElementById('linkEntregasDisponiveis');
const estafetaIdDashboard = zonaSelectDashboard.getAttribute('data-estafeta-id') || '';
const storageZonaKeyDashboard = `estafeta_zona_trabalho_${estafetaIdDashboard || 'default'}`;

const zonaGuardadaDashboard = sessionStorage.getItem(storageZonaKeyDashboard);
if (zonaGuardadaDashboard) {
    zonaSelectDashboard.value = zonaGuardadaDashboard;
}

const validarESalvarZona = () => {
    const zonaSelecionada = (zonaSelectDashboard.value || '').trim();

    if (!zonaSelecionada) {
        alert('Escolhe a zona de trabalho antes de continuar.');
        zonaSelectDashboard.focus();
        return false;
    }

    sessionStorage.setItem(storageZonaKeyDashboard, zonaSelecionada);
    return true;
};

btnIrEntregasComZona.addEventListener('click', () => {
    if (validarESalvarZona()) {
        location.href = '/estafeta/entregas';
    }
});

if (linkEntregasDisponiveis) {
    linkEntregasDisponiveis.addEventListener('click', (e) => {
        if (!validarESalvarZona()) {
            e.preventDefault();
        }
    });
}