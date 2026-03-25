document.addEventListener('DOMContentLoaded', function() {
    const mapaElement = document.getElementById('mapa-entregas');
    if (!mapaElement) return;

    const mapa = L.map('mapa-entregas').setView([41.15, -8.61], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapa);

    // Carregar supermercados ativos via API
    fetch('/estafeta/api/supermercados')
        .then(res => res.json())
        .then(data => {
            if (data.sucesso && data.supermercados) {
                data.supermercados.forEach(s => {
                    if (s.localizacaoGeo && s.localizacaoGeo.coordinates) {
                        const [lon, lat] = s.localizacaoGeo.coordinates;
                        
                        // Adicionar Marcador
                        L.marker([lat, lon])
                            .addTo(mapa)
                            .bindPopup('<strong>' + s.nome + '</strong><br>Entrega: ' + (s.custoEntrega || 0).toFixed(2) + '€');

                        // Círculo de área de atuação (raioAtuacao em Km -> metros)
                        L.circle([lat, lon], {
                            color: '#28a745',
                            weight: 2,
                            opacity: 0.5,
                            fillColor: '#28a745',
                            fillOpacity: 0.1,
                            radius: (s.raioAtuacao || 5) * 1000
                        }).addTo(mapa);
                    }
                });
            }
        });

    // Botão Minha posição
    const btnMinhaPosicao = document.getElementById('btn-minha-posicao');
    if (btnMinhaPosicao) {
        btnMinhaPosicao.innerText = 'Minha Posição'; // Garante que o texto existe
        btnMinhaPosicao.addEventListener('click', function() {
            if (navigator.geolocation) {
                const statusLocalizacao = document.getElementById('status-localizacao');
                if (statusLocalizacao) statusLocalizacao.innerText = 'A obter localização...';
                
                navigator.geolocation.getCurrentPosition(function(pos) {
                    const lat = pos.coords.latitude;
                    const lon = pos.coords.longitude;
                    
                    // Redirecionar com coordenadas para filtrar no servidor
                    window.location.href = `/estafeta/entregas?lat=${lat}&lng=${lon}`;
                    
                }, function(error) {
                    alert('Erro ao obter localização: ' + error.message);
                    if (statusLocalizacao) statusLocalizacao.innerText = 'Erro na localização';
                });
            } else {
                alert('Geolocalização não suportada pelo seu navegador.');
            }
        });
    }

    // Se já tivermos coordenadas no URL, mostrar marcador do estafeta
    const urlParams = new URLSearchParams(window.location.search);
    const latParam = urlParams.get('lat');
    const lngParam = urlParams.get('lng');

    if (latParam && lngParam) {
        const lat = parseFloat(latParam);
        const lon = parseFloat(lngParam);
        
        L.circleMarker([lat, lon], {
            radius: 8,
            fillColor: "#007bff",
            color: "#fff",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(mapa).bindPopup('A sua localização').openPopup();
        
        mapa.setView([lat, lon], 13);
    }

    // Clique no mapa para definir posição manualmente
    mapa.on('click', function(e) {
        const { lat, lng } = e.latlng;
        
        // Confirmar se deseja filtrar por este ponto
        if (confirm(`Deseja ver encomendas disponíveis para esta localização?`)) {
            window.location.href = `/estafeta/entregas?lat=${lat}&lng=${lng}`;
        }
    });
});
