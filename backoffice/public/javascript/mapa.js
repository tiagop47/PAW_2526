/**
 * Lógica Global de Mapas (Leaflet)
 * Responsável por inicializar, carregar dados e gerir camadas de supermercados e entregas.
 */

let meuMapa;

// --- CONFIGURAÇÕES ---
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

// Armazenamento de camadas para manipulação dinâmica (filtros/foco)
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
function adicionarMercadoNoMapa(id, nome, lat, lon, zona = '') {
    const pos = [lat, lon];
    const marker = L.marker(pos).addTo(meuMapa).bindPopup(`<b>${nome}</b>`);

    const RAIO_PADRAO = 5;
    const raioVisual = RAIO_PADRAO * CONFIG.MULTIPLIER_RAIO;

    const area = L.circle(pos, {
        color: CONFIG.ESTILO_AREA.color,
        fillColor: CONFIG.ESTILO_AREA.fillColor,
        fillOpacity: CONFIG.ESTILO_AREA.fillOpacity,
        weight: CONFIG.ESTILO_AREA.weight,
        radius: raioVisual
    }).addTo(meuMapa);

    layers.mercados[id] = { marker, area, zona: (zona || '').toLowerCase().trim() };
}

/**
 * Carrega todos os mercados ativos da API e ajusta a visualização.
 */
async function carregarMercadosDoServidor() {
    try {
        const res = await fetch(CONFIG.ROTAS.mercados);
        const dados = await res.json();
        const mercados = Array.isArray(dados) ? dados : (dados.supermercados || []);

        const coords = [];
        mercados.forEach(m => {
            const c = m.localizacaoGeo?.coordinates;
            if (!c) {
                return;
            }

            adicionarMercadoNoMapa(m._id, m.nome, c[1], c[0], m.localizacao);
            coords.push([c[1], c[0]]);
        });


        if (coords.length > 0) {
            meuMapa.fitBounds(L.latLngBounds(coords), { padding: [50, 50] });
        }

        if (location.pathname.includes('/estafeta')) {
            carregarEntregasDisponiveis();
        }
    } catch (err) {
        console.error("Erro ao carregar mercados:", err);
    }
}

/**
 * Filtra a visibilidade dos elementos no mapa por zona.
 */
function filtrarMercadosNoMapa(zona = '') {
    const z = (zona || '').toLowerCase().trim();
    const coordsVisiveis = [];

    // Filtrar Mercados
    Object.values(layers.mercados).forEach(m => {
        const visivel = !z || m.zona === z;
        if (visivel) {
            m.marker.addTo(meuMapa);
            m.area.addTo(meuMapa);
            coordsVisiveis.push(m.marker.getLatLng());
        } else {
            meuMapa.removeLayer(m.marker);
            meuMapa.removeLayer(m.area);
        }
    });

    // Filtrar Destinos
    layers.destinos.forEach(d => {
        const visivel = !z || d.zona === z;
        if (visivel) {
            d.marker.addTo(meuMapa);
            coordsVisiveis.push(d.marker.getLatLng());
        } else {
            meuMapa.removeLayer(d.marker);
        }
    });

    // Focar automaticamente em tudo o que estiver visível na zona
    if (z && coordsVisiveis.length > 0 && meuMapa) {
        const bounds = L.latLngBounds(coordsVisiveis);
        meuMapa.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
}

/**
 * Carrega e desenha os pontos de entrega (encomendas).
 */
async function carregarEntregasDisponiveis() {
    try {
        const res = await fetch(CONFIG.ROTAS.entregas);
        const dados = await res.json();
        if (!dados.sucesso) return;

        layers.destinos.forEach(d => meuMapa.removeLayer(d.marker));
        layers.destinos = [];

        dados.entregas.forEach(e => {
            const coords = e.coordenadasEntrega;
            if (!coords?.lat || !coords?.lng) return;

            const marker = L.circleMarker([coords.lat, coords.lng], {
                radius: 6, color: CONFIG.CORES.destino, fillColor: CONFIG.CORES.destino, fillOpacity: 0.8
            }).addTo(meuMapa);

            layers.destinos.push({ marker, zona: (e.supermercadoId?.localizacao || '').toLowerCase().trim() });
        });

        const estafetaId = document.body.getAttribute('data-estafeta-id');
        const zonaSessao = sessionStorage.getItem(`estafeta_zona_trabalho_${estafetaId || 'default'}`);

        filtrarMercadosNoMapa(zonaSessao);
    } catch (err) {
        console.error("Erro ao carregar entregas:", err);
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
