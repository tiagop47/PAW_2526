const mapaElement = document.getElementById('mapa-supermercados-ativos');
const dadosBrutos = document.getElementById('dados-supermercados-ativos');

document.addEventListener('DOMContentLoaded', function () {

    if (!mapaElement || !dadosBrutos) {
        return;
    }

    inicializarMapa('mapa-supermercados-ativos');
    const mercados = JSON.parse(dadosBrutos.getAttribute('data-supermercados') || '[]');
    const coordenadasParaCentro = [];

    mercados.forEach((m) => {
        if (m.localizacaoGeo && m.localizacaoGeo.coordinates) {
            const [lon, lat] = m.localizacaoGeo.coordinates;
            adicionarMercadoNoMapa(m._id, m.nome, lat, lon, m.raioAtuacao || 5);
            coordenadasParaCentro.push([lat, lon]);
        }
    });

    if (coordenadasParaCentro.length > 0 && meuMapa) {
        const bounds = L.latLngBounds(coordenadasParaCentro);
        meuMapa.fitBounds(bounds, { padding: [50, 50] });
    }
});
