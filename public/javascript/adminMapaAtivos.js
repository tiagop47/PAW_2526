const mapaElement = document.getElementById('mapa-supermercados-ativos');
const dadosBrutos = document.getElementById('dados-supermercados-ativos');

document.addEventListener('DOMContentLoaded', function () {

    if (!mapaElement) {
        return;
    }

    if (!dadosBrutos) {
        return;
    }

    inicializarMapa('mapa-supermercados-ativos');
    const mercados = JSON.parse(dadosBrutos.getAttribute('data-supermercados') || '[]');

    mercados.forEach((mapa) => {
        if (mapa.localizacaoGeo && mapa.localizacaoGeo.coordinates) {
            const [lon, lat] = mapa.localizacaoGeo.coordinates;
            adicionarMercadoNoMapa(mapa.nome, lat, lon, mapa.raioAtuacao || 5);
        }
    });
});
