const latInput = document.getElementById('input-lat');
const lonInput = document.getElementById('input-lon');

if (latInput && lonInput) {
    document.addEventListener('DOMContentLoaded', function () {
        const latInicial = parseFloat(latInput.value) || 41.15;
        const lonInicial = parseFloat(lonInput.value) || -8.61;

        const map = inicializarMapa('mapa-edicao', latInicial, lonInicial, 15);
        if (!map) return;

        L.marker([latInicial, lonInicial]).addTo(map);
        configurarCliqueMarcador(map, latInput, lonInput);

        setTimeout(() => map.invalidateSize(), 200);
    });
}
