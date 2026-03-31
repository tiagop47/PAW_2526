document.addEventListener('DOMContentLoaded', function () {
    // Inicializa o mapa numa posição central padrão
    inicializarMapa('mapa-entregas');
    
    // Carrega todos os mercados e encomendas sem filtros de localização
    carregarMercadosDoServidor();

    // O botão "Minha Posição" agora apenas centra o mapa no utilizador, 
    // sem recarregar a página ou filtrar as encomendas
    const btnMinhaPosicao = document.getElementById('btn-minha-posicao');
    if (btnMinhaPosicao) {
        btnMinhaPosicao.onclick = function () {
            navigator.geolocation.getCurrentPosition(function (pos) {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                if (meuMapa) {
                    meuMapa.setView([lat, lon], 14);
                    // Opcional: apenas um marcador temporário para saber onde está
                    L.circleMarker([lat, lon], { radius: 5, color: 'blue' }).addTo(meuMapa).bindPopup("Sua localização").openPopup();
                }
            });
        }
    }
});
