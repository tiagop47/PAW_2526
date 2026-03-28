document.addEventListener('DOMContentLoaded', function () {
    const mapaElement = document.getElementById('mapa-supermercados-ativos');
    const dadosBrutos = document.getElementById('dados-supermercados-ativos');

    if (!mapaElement) {
        return;
    }

    inicializarMapa('mapa-supermercados-ativos');

    if (!dadosBrutos) {
        return;
    }

    const mercados = JSON.parse(dadosBrutos.getAttribute('data-supermercados') || '[]');

    mercados.forEach((mapa) => {
        if (mapa.localizacaoGeo && mapa.localizacaoGeo.coordinates) {
            const [lon, lat] = mapa.localizacaoGeo.coordinates;
            adicionarMercadoNoMapa(mapa.nome, lat, lon, mapa.raioAtuacao || 5);
        }
    });
});
