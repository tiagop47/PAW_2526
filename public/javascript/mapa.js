let meuMapa;

const ROTA_MERCADOS_ADMIN = '/admin/api/mercados-ativos';
const ROTA_MERCADOS_ESTAFETA = '/estafeta/api/supermercados';
const ROTA_ENTREGAS_ESTAFETA = '/estafeta/api/entregas';
const COR_MERCADO = '#007bff';
const COR_DESTINO = '#dc3545';

function inicializarMapa(idElemento, lat = 41.15, lon = -8.61, zoom = 12) {
    const container = document.getElementById(idElemento);
    if (!container) return null;

    meuMapa = L.map(idElemento).setView([lat, lon], zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(meuMapa);

    return meuMapa;
}

function configurarCliqueMarcador(mapa, inputLat, inputLon) {
    let marcador;
    mapa.on('click', function (e) {
        const lat = e.latlng.lat;
        const lon = e.latlng.lng;

        inputLat.value = lat.toFixed(6);
        inputLon.value = lon.toFixed(6);

        if (marcador) {
            marcador.setLatLng([lat, lon]);
        } else {
            marcador = L.marker([lat, lon]).addTo(mapa);
        }
    });
    return marcador;
}

const marcadoresSupermercados = {};
const marcadoresDestinos = [];

function normalizarZona(zona) {
    return (zona || '').toString().trim().toLowerCase();
}

function obterZonaAtivaDaSessao() {
    const estafetaId = document.body.getAttribute('data-estafeta-id') || '';
    const storageZonaKey = `estafeta_zona_trabalho_${estafetaId || 'default'}`;
    return normalizarZona(sessionStorage.getItem(storageZonaKey));
}

function alternarCamada(camada, mostrar) {
    if (!meuMapa || !camada) return;
    const existeNoMapa = meuMapa.hasLayer(camada);

    if (mostrar && !existeNoMapa) {
        camada.addTo(meuMapa);
        return;
    }

    if (!mostrar && existeNoMapa) {
        meuMapa.removeLayer(camada);
    }
}

function adicionarMercadoNoMapa(id, nome, lat, lon, raioKm, zona = '') {
    const marker = L.marker([lat, lon]).addTo(meuMapa);
    marker.bindPopup(`<b>${nome}</b><br><small>A carregar estado...</small>`);
    const area = L.circle([lat, lon], {
        color: COR_MERCADO,
        fillColor: COR_MERCADO,
        fillOpacity: 0.1,
        radius: (raioKm * 1000) / 5
    }).addTo(meuMapa);

    // Guardar marcador para acesso posterior
    marcadoresSupermercados[id] = {
        marker: marker,
        area: area,
        nome: nome,
        zona: normalizarZona(zona),
        lat: lat,
        lon: lon
    };
}

async function carregarMercadosDoServidor() {
    try {
        const isAdmin = !location.pathname.includes('/estafeta');
        const rota = isAdmin ? ROTA_MERCADOS_ADMIN : ROTA_MERCADOS_ESTAFETA;

        const resposta = await fetch(rota);
        const dados = await resposta.json();

        const mercados = dados.supermercados || dados.mercados || [];
        const coordenadasParaCentro = [];

        mercados.forEach((m) => {
            const coordenadas = m.localizacaoGeo && m.localizacaoGeo.coordinates;
            if (!coordenadas) return;

            const [lon, latM] = coordenadas;
            adicionarMercadoNoMapa(m._id, m.nome, latM, lon, m.raioAtuacao || 5, m.localizacao || '');
            coordenadasParaCentro.push([latM, lon]);
        });

        // Ajustar o mapa para mostrar todos os marcadores (Centralização Automática)
        if (coordenadasParaCentro.length > 0 && meuMapa) {
            const bounds = L.latLngBounds(coordenadasParaCentro);
            meuMapa.fitBounds(bounds, { padding: [50, 50] });
        }

        // Só carregar contagem de encomendas se NÃO for admin
        if (!isAdmin) {
            carregarEntregasDisponiveis();
        }
    } catch (erro) {
        console.error("Erro ao carregar mercados:", erro);
    }
}

function filtrarMercadosNoMapa(zona = '') {
    const zonaNormalizada = normalizarZona(zona);

    Object.values(marcadoresSupermercados).forEach((mercado) => {
        const mostrar = !zonaNormalizada || mercado.zona === zonaNormalizada;
        alternarCamada(mercado.marker, mostrar);
        alternarCamada(mercado.area, mostrar);
    });

    marcadoresDestinos.forEach((destino) => {
        const mostrar = !zonaNormalizada || destino.zona === zonaNormalizada;
        alternarCamada(destino.marker, mostrar);
    });
}

function limparDestinosNoMapa() {
    marcadoresDestinos.forEach((destino) => {
        alternarCamada(destino.marker, false);
    });
    marcadoresDestinos.length = 0;
}

async function carregarEntregasDisponiveis() {
    try {
        const resposta = await fetch(ROTA_ENTREGAS_ESTAFETA);
        const dados = await resposta.json();

        if (!dados.sucesso || !Array.isArray(dados.entregas)) return;

        limparDestinosNoMapa();

        // Contar encomendas por supermercado
        const contagem = {};
        dados.entregas.forEach((e) => {
            const sId = e.supermercadoId._id || e.supermercadoId;
            contagem[sId] = (contagem[sId] || 0) + 1;

            const lat = Number(e.coordenadasEntrega && e.coordenadasEntrega.lat);
            const lng = Number(e.coordenadasEntrega && e.coordenadasEntrega.lng);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

            const zonaSupermercado = e.supermercadoId && e.supermercadoId.localizacao ? e.supermercadoId.localizacao : '';
            const marker = L.circleMarker([lat, lng], {
                radius: 6,
                color: COR_DESTINO,
                fillColor: COR_DESTINO,
                fillOpacity: 0.8
            }).addTo(meuMapa);

            marker.bindPopup(`
                <div class="text-center">
                    <b>Destino da entrega</b><br>
                    <small>Encomenda #${e._id.toString().slice(-6).toUpperCase()}</small>
                </div>
            `);

            marcadoresDestinos.push({
                marker,
                zona: normalizarZona(zonaSupermercado),
                lat,
                lng
            });
        });

        // Atualizar popups
        Object.keys(marcadoresSupermercados).forEach((id) => {
            const total = contagem[id] || 0;
            const m = marcadoresSupermercados[id];
            m.marker.setPopupContent(`
                <div class="text-center">
                    <b>${m.nome}</b><br>
                    <span class="badge bg-dark">${total} encomendas disponíveis</span>
                </div>
            `);
        });

        filtrarMercadosNoMapa(obterZonaAtivaDaSessao());
    } catch (erro) {
        console.error("Erro ao carregar contagem:", erro);
    }
}

// Função para a lista interagir com o mapa
function focarNoMapa(id) {
    const m = marcadoresSupermercados[id];
    if (m && meuMapa) {
        meuMapa.setView([m.lat, m.lon], 15);
        m.marker.openPopup();
    }
}

function focarDestinoNoMapa(lat, lng) {
    const latNum = Number(lat);
    const lngNum = Number(lng);

    meuMapa.setView([latNum, lngNum], 16);

    const destino = marcadoresDestinos.find((m) => m.lat === latNum && m.lng === lngNum);
    if (destino) {
        destino.marker.openPopup();
    }
}
