const mapaElement = document.getElementById('mapa-supermercados-ativos');
const dadosBrutos = document.getElementById('dados-supermercados-ativos');

document.addEventListener('DOMContentLoaded', function () {

    if (!mapaElement || !dadosBrutos) {
        return;
    }

    inicializarMapa('mapa-supermercados-ativos');
    const mercados = JSON.parse(dadosBrutos.getAttribute('data-supermercados') || '[]');
    const coordenadasParaCentro = [];

    mercados.forEach((mapa) => {
        if (mapa.localizacaoGeo && mapa.localizacaoGeo.coordinates) {
            const [lon, lat] = mapa.localizacaoGeo.coordinates;
            adicionarMercadoNoMapa(mapa._id, mapa.nome, lat, lon);
            coordenadasParaCentro.push([lat, lon]);
        }
    });

    if (coordenadasParaCentro.length > 0 && meuMapa) {
        const bounds = L.latLngBounds(coordenadasParaCentro);
        Object.values(layers.mercados).forEach(m => {
            if (m.area) bounds.extend(m.area.getBounds());
        });
        meuMapa.fitBounds(bounds, { padding: [50, 50] });
    }
});
