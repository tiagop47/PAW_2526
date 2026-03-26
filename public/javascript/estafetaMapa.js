document.addEventListener('DOMContentLoaded', function () {
    const mapaElement = document.getElementById('mapa-entregas');
    if (!mapaElement || typeof AppMapa === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const latParam = urlParams.get('lat');
    const lngParam = urlParams.get('lng');
    const temFiltroPorCoordenadas = latParam && lngParam;

    const redirecionarParaEntregas = function (lat, lng) {
        window.location.href = `/estafeta/entregas?lat=${lat}&lng=${lng}`;
    };

    const mapa = AppMapa.init('mapa-entregas', [41.15, -8.61], 12);

    const pedidos = [fetch('/estafeta/api/supermercados').then(res => res.json())];

    if (temFiltroPorCoordenadas) {
        pedidos.push(fetch(`/estafeta/api/supermercados-cobertura?lat=${encodeURIComponent(latParam)}&lng=${encodeURIComponent(lngParam)}`).then(res => res.json()));
    }

    Promise.all(pedidos)
        .then(([todosData, coberturaData]) => {
            if (todosData.sucesso && todosData.supermercados) {
                const supermercadosCobertura = coberturaData && coberturaData.sucesso ? coberturaData.supermercados : [];
                const idsCobertura = new Set(supermercadosCobertura.map(s => String(s._id)));

                todosData.supermercados.forEach(s => {
                    if (s.localizacaoGeo && s.localizacaoGeo.coordinates) {
                        const [lon, lat] = s.localizacaoGeo.coordinates;
                        const cobrePontoFiltrado = !temFiltroPorCoordenadas || idsCobertura.has(String(s._id));

                        const area = AppMapa.addArea(s.nome, lat, lon, s.raioAtuacao || 5, {
                            color: cobrePontoFiltrado ? '#28a745' : '#6c757d',
                            visual: false,
                            fillOpacity: cobrePontoFiltrado ? 0.2 : 0.05,
                            opacity: cobrePontoFiltrado ? 0.6 : 0.3,
                            popupContent: '<strong>' + s.nome + '</strong><br>Entrega: ' + (s.custoEntrega || 0).toFixed(2) + '€'
                        });

                        // Clicar dentro do raio usa o ponto clicado para filtrar entregas.
                        if (area) {
                            area.on('click', function (e) {
                                if (e.originalEvent) e.originalEvent.stopPropagation();
                                redirecionarParaEntregas(e.latlng.lat, e.latlng.lng);
                            });
                        }
                    }
                });
            }
        })
        .catch(() => {
            // Mantém a página funcional caso exista erro num endpoint de mapa.
        });

    const btnMinhaPosicao = document.getElementById('btn-minha-posicao');
    if (btnMinhaPosicao) {
        btnMinhaPosicao.innerText = 'Minha Posição';
        btnMinhaPosicao.addEventListener('click', function () {
            if (navigator.geolocation) {
                const statusLocalizacao = document.getElementById('status-localizacao');
                if (statusLocalizacao) {
                    statusLocalizacao.innerText = 'A obter localização...';
                }

                navigator.geolocation.getCurrentPosition(function (pos) {
                    const lat = pos.coords.latitude;
                    const lon = pos.coords.longitude;

                    // Redirecionar com coordenadas para filtrar no servidor
                    window.location.href = `/estafeta/entregas?lat=${lat}&lng=${lon}`;

                }, function (error) {
                    alert('Erro ao obter localização: ' + error.message);
                    if (statusLocalizacao) statusLocalizacao.innerText = 'Erro na localização';
                });
            } else {
                alert('Geolocalização não suportada pelo seu navegador.');
            }
        });
    }
    if (latParam && lngParam) {
        const lat = parseFloat(latParam);
        const lon = parseFloat(lngParam);

        L.circleMarker([lat, lon], {
            radius: 5,
            fillColor: "#007bff",
            color: "#fff",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(mapa).bindPopup('A sua localização').openPopup();

        mapa.setView([lat, lon], 13);
    }

    // Clique no mapa para definir posição manualmente
    mapa.on('click', function (e) {
        const { lat, lng } = e.latlng;
        redirecionarParaEntregas(lat, lng);
    });
});
