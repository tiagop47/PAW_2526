/**
 * Lógica para Edição de Localização e Configurações do Supermercado
 */
document.addEventListener('DOMContentLoaded', function () {
    const mapaContainer = document.getElementById('mapa-edicao');
    if (!mapaContainer) return;

    const latInput = document.getElementById('input-lat');
    const lonInput = document.getElementById('input-lon');

    const latInicial = parseFloat(latInput.value) || 41.15;
    const lonInicial = parseFloat(lonInput.value) || -8.61;

    const map = L.map('mapa-edicao').setView([latInicial, lonInicial], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    let marker = L.marker([latInicial, lonInicial]).addTo(map);

    map.on('click', function (e) {
        const { lat, lng } = e.latlng;

        latInput.value = lat.toFixed(6);
        lonInput.value = lng.toFixed(6);

        if (marker) {
            marker.setLatLng(e.latlng);
        } else {
            marker = L.marker(e.latlng).addTo(map);
        }
    });

    //Tempo de renderizar
    setTimeout(() => map.invalidateSize(), 200);
});
