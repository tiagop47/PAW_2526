const btnMinhaPosicao = document.getElementById('btn-minha-posicao');
const mapaElement = document.getElementById('mapa-entregas');

document.addEventListener('DOMContentLoaded', function () {
    inicializarMapa('mapa-entregas');
    carregarMercadosDoServidor();

    const urlParams = new URLSearchParams(location.search);
    const latParam = urlParams.get('lat');
    const lngParam = urlParams.get('lng');

    if (latParam && lngParam) {
        desenharLocalizacaoEstafeta(parseFloat(latParam), parseFloat(lngParam));
        if (meuMapa) {
            meuMapa.setView([parseFloat(latParam), parseFloat(lngParam)], 13);
        }
    }

    btnMinhaPosicao.onclick = function () {
        navigator.geolocation.getCurrentPosition(function (pos) {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            location.href = `/estafeta/entregas?lat=${lat}&lng=${lon}`;
        });
    }

    if (meuMapa) {
        meuMapa.on('click', function (e) {
            location.href = `/estafeta/entregas?lat=${e.latlng.lat}&lng=${e.latlng.lng}`;
        });
    }
});
