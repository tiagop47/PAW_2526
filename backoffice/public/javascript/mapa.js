/**
 * Lógica Global de Mapas (Leaflet)
 * Responsável por inicializar, carregar dados e gerir camadas de supermercados e entregas.
 */

let meuMapa;

const CONFIG = {
    CORES: { mercado: '#000000', destino: '#333333' },
    ESTILO_AREA: { color: '#000000', fillColor: '#000000', fillOpacity: 0.15, weight: 2 },
    COORD_PADRAO: [41.2777, -8.2814], // Lousada
    MULTIPLIER_RAIO: 300, // Escala visual normalizada
    ZOOM_PADRAO: 12,
    ROTAS: {
        mercados: '/api/supermercados',
        entregas: '/api/estafeta/entregas'
    }
};

const layers = {
    mercados: {}, // { id: { marker, area, zona } }
    destinos: []  // [ { marker, zona } ]
};

/**
 * Inicializa o mapa num elemento HTML.
 */
function inicializarMapa(idElemento, lat = CONFIG.COORD_PADRAO[0], lon = CONFIG.COORD_PADRAO[1], zoom = CONFIG.ZOOM_PADRAO) {
    const container = document.getElementById(idElemento);
    if (!container || container._leaflet_id) return null;

    meuMapa = L.map(idElemento).setView([lat, lon], zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(meuMapa);

    return meuMapa;
}
/**
 * Adiciona um supermercado e a sua área de atuação ao mapa.
 */
function adicionarMercadoNoMapa(id, nome, lat, lon, zona = '', raioKm = 5) {
    const pos = [lat, lon];
    const marker = L.marker(pos).addTo(meuMapa).bindPopup(`<b>${nome}</b>`);

    const raioVisual = raioKm * CONFIG.MULTIPLIER_RAIO;

    const area = L.circle(pos, {
        color: CONFIG.ESTILO_AREA.color,
        fillColor: CONFIG.ESTILO_AREA.fillColor,
        fillOpacity: CONFIG.ESTILO_AREA.fillOpacity,
        weight: CONFIG.ESTILO_AREA.weight,
        radius: raioVisual
    }).addTo(meuMapa);

    layers.mercados[id] = { marker, area, zona: (zona || '').trim().toLowerCase() };
}

/**
 * Carrega todos os mercados ativos da API e ajusta a visualização.
 */
async function carregarMercadosDoServidor() {
    try {
        const resposta = await fetch(CONFIG.ROTAS.mercados);
        const dados = await resposta.json();
        const mercados = Array.isArray(dados) ? dados : (dados.supermercados || []);

        const coordenadasGerais = [];
        mercados.forEach(mercado => {
            const coordenadas = mercado.localizacaoGeo?.coordinates;
            if (!coordenadas) {
                return;
            }

            adicionarMercadoNoMapa(
                mercado._id,
                mercado.nome,
                coordenadas[1],
                coordenadas[0],
                mercado.localizacao,
                mercado.raioEntregaKm || 5
            );
            coordenadasGerais.push([coordenadas[1], coordenadas[0]]);
        });


        const estafetaId = document.body.getAttribute('data-estafeta-id');
        const zonaSessao = sessionStorage.getItem(`estafeta_zona_trabalho_${estafetaId || 'default'}`);

        // Só ajusta a visão global se não estivermos no contexto de estafeta com zona definida
        if (coordenadasGerais.length > 0 && (!location.pathname.includes('/estafeta') || !zonaSessao)) {
            meuMapa.fitBounds(L.latLngBounds(coordenadasGerais), { padding: [50, 50] });
        }

        if (location.pathname.includes('/estafeta')) {
            await carregarEntregasDisponiveis();
        }
    } catch (erro) {
        console.error("Erro ao carregar mercados:", erro);
    }
}

/**
 * Filtra a visibilidade dos elementos no mapa por zona.
 */
function filtrarMercadosNoMapa(zona = '') {
    const zonaAlvo = (zona || '').toLowerCase().trim();
    let limitesDaZona = null;

    Object.values(layers.mercados).forEach(mercado => {
        const estaVisivel = !zonaAlvo || mercado.zona === zonaAlvo;
        if (estaVisivel) {
            mercado.marker.addTo(meuMapa);
            mercado.area.addTo(meuMapa);
            if (zonaAlvo) {
                limitesDaZona = limitesDaZona
                    ? limitesDaZona.extend(mercado.area.getBounds())
                    : mercado.area.getBounds();
            }
        } else {
            meuMapa.removeLayer(mercado.marker);
            meuMapa.removeLayer(mercado.area);
        }
    });

    layers.destinos.forEach(destino => {
        const estaVisivel = !zonaAlvo || destino.zona === zonaAlvo;
        if (estaVisivel) {
            destino.marker.addTo(meuMapa);
        } else {
            meuMapa.removeLayer(destino.marker);
        }
    });

    if (zonaAlvo && limitesDaZona && meuMapa) {
        meuMapa.fitBounds(limitesDaZona, { padding: [50, 50] });
    }
}

/**
 * Carrega e desenha os pontos de entrega (encomendas).
 */
async function carregarEntregasDisponiveis() {
    try {
        const resposta = await fetch(CONFIG.ROTAS.entregas);
        const dados = await resposta.json();
        if (!dados.sucesso) {
            return;
        }
a
        layers.destinos.forEach(destino => meuMapa.removeLayer(destino.marker));
        layers.destinos = [];

        dados.entregas.forEach(entrega => {
            const coordenadas = entrega.coordenadasEntrega;
            if (!coordenadas?.lat || !coordenadas?.lng) {
                return;
            }

            const marcador = L.circleMarker([coordenadas.lat, coordenadas.lng], {
                radius: 6, color: CONFIG.CORES.destino, fillColor: CONFIG.CORES.destino, fillOpacity: 0.8
            }).addTo(meuMapa);

            layers.destinos.push({
                marker: marcador,
                zona: (entrega.supermercadoId?.localizacao || '').toLowerCase().trim()
            });
        });

        const estafetaId = document.body.getAttribute('data-estafeta-id');
        const zonaSessao = sessionStorage.getItem(`estafeta_zona_trabalho_${estafetaId || 'default'}`);

        filtrarMercadosNoMapa(zonaSessao);
    } catch (erro) {
        console.error("Erro ao carregar entregas:", erro);
    }
}

/**
 * Configura o mapa para actualizar inputs de lat/lon ao clicar.
 */
function configurarCliqueMarcador(map, latInput, lonInput) {
    let marcador = null;

    const latInicial = parseFloat(latInput.value);
    const lonInicial = parseFloat(lonInput.value);

    if (latInicial && lonInicial) {
        marcador = L.marker([latInicial, lonInicial]).addTo(map);
    }

    map.on('click', function (e) {
        latInput.value = e.latlng.lat.toFixed(6);
        lonInput.value = e.latlng.lng.toFixed(6);

        if (!marcador) {
            marcador = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);
        } else {
            marcador.setLatLng([e.latlng.lat, e.latlng.lng]);
        }
    });
}

/**
 * Utilitários de Foco/Navegação
 */
function focarNoMapa(id) {
    const m = layers.mercados[id];

    if (m) {
        meuMapa.setView(m.marker.getLatLng(), 15);
        m.marker.openPopup();
    }
}

function focarDestinoNoMapa(lat, lng) {
    if (meuMapa && lat && lng) {
        meuMapa.setView([lat, lng], 16);
    }
}
