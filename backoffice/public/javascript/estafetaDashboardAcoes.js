const zonaSelectDashboard = document.getElementById('zonaTrabalhoDashboard');
const btnIrEntregasComZona = document.getElementById('btnIrEntregasComZona');
const estafetaIdDashboard = zonaSelectDashboard.getAttribute('data-estafeta-id') || '';
const storageZonaKeyDashboard = `estafeta_zona_trabalho_${estafetaIdDashboard || 'default'}`;

const zonaGuardadaDashboard = sessionStorage.getItem(storageZonaKeyDashboard);
if (zonaGuardadaDashboard) {
    zonaSelectDashboard.value = zonaGuardadaDashboard;
}

btnIrEntregasComZona.addEventListener('click', () => {
    const zonaSelecionada = (zonaSelectDashboard.value || '').trim();

    if (!zonaSelecionada) {
        alert('Escolhe a zona de trabalho antes de continuar.');
        zonaSelectDashboard.focus();
        return;
    }

    sessionStorage.setItem(storageZonaKeyDashboard, zonaSelecionada);
    location.href = '/estafeta/entregas';
});