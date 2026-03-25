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

/**
 * Lógica do Mapa de Registo
 */
document.addEventListener('DOMContentLoaded', function() {
    const mapaContainer = document.getElementById('mapa-registo');
    if (!mapaContainer) return;

    // Inicializar mapa (focado em Portugal)
    const map = L.map('mapa-registo').setView([41.15, -8.61], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    let marker;

    map.on('click', function(e) {
        const { lat, lng } = e.latlng;

        // Atualizar campos de coordenadas
        document.getElementById('input-lat').value = lat.toFixed(6);
        document.getElementById('input-lon').value = lng.toFixed(6);

        // Atualizar/Criar marcador
        if (marker) {
            marker.setLatLng(e.latlng);
        } else {
            marker = L.marker(e.latlng).addTo(map);
        }
    });

    // Re-renderizar o mapa quando o seletor de role mudar para garantir que aparece direito
    seletorRole.addEventListener('change', function() {
        if (this.value === 'supermercados') {
            setTimeout(() => map.invalidateSize(), 200);
        }
    });
});
