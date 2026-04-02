let meuMapa;

function inicializarMapa(idElemento, lat = 41.15, lon = -8.61) {
    const container = document.getElementById(idElemento);
    if (!container) return;

    meuMapa = L.map(idElemento).setView([lat, lon], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(meuMapa);
}

const marcadoresSupermercados = {};
const marcadoresDestinos = [];

function normalizarZona(zona) {
    return (zona || '').toString().trim().toLowerCase();
}

function adicionarMercadoNoMapa(id, nome, lat, lon, raioKm, zona = '') {
    const corPadrao = '#007bff';

    const marker = L.marker([lat, lon]).addTo(meuMapa);
    marker.bindPopup(`<b>${nome}</b><br><small>A carregar estado...</small>`);
    const area = L.circle([lat, lon], {
        color: corPadrao,
        fillColor: corPadrao,
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
        let rota = '/admin/api/mercados-ativos';
        const isAdmin = !location.pathname.includes('/estafeta');
        
        if (!isAdmin) {
            rota = '/estafeta/api/supermercados';
        }

        const resposta = await fetch(rota);
        const dados = await resposta.json();

        const mercados = dados.supermercados || dados.mercados || [];
        const coordenadasParaCentro = [];

        mercados.forEach(m => {
            if (m.localizacaoGeo && m.localizacaoGeo.coordinates) {
                const [lon, latM] = m.localizacaoGeo.coordinates;
                adicionarMercadoNoMapa(m._id, m.nome, latM, lon, m.raioAtuacao || 5, m.localizacao || '');
                coordenadasParaCentro.push([latM, lon]);
            }
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

        if (mostrar) {
            if (!meuMapa.hasLayer(mercado.marker)) {
                mercado.marker.addTo(meuMapa);
            }
            if (!meuMapa.hasLayer(mercado.area)) {
                mercado.area.addTo(meuMapa);
            }
            return;
        }

        if (meuMapa.hasLayer(mercado.marker)) {
            meuMapa.removeLayer(mercado.marker);
        }
        if (meuMapa.hasLayer(mercado.area)) {
            meuMapa.removeLayer(mercado.area);
        }
    });

    marcadoresDestinos.forEach((destino) => {
        const mostrar = !zonaNormalizada || destino.zona === zonaNormalizada;
        if (mostrar) {
            if (!meuMapa.hasLayer(destino.marker)) {
                destino.marker.addTo(meuMapa);
            }
            return;
        }

        if (meuMapa.hasLayer(destino.marker)) {
            meuMapa.removeLayer(destino.marker);
        }
    });
}

function limparDestinosNoMapa() {
    marcadoresDestinos.forEach((destino) => {
        if (meuMapa.hasLayer(destino.marker)) {
            meuMapa.removeLayer(destino.marker);
        }
    });
    marcadoresDestinos.length = 0;
}

async function carregarEntregasDisponiveis() {
    try {
        const resposta = await fetch('/estafeta/api/entregas');
        const dados = await resposta.json();

        if (dados.sucesso && dados.entregas) {
            limparDestinosNoMapa();

            // Contar encomendas por supermercado
            const contagem = {};
            dados.entregas.forEach(e => {
                const sId = e.supermercadoId._id || e.supermercadoId;
                contagem[sId] = (contagem[sId] || 0) + 1;

                const lat = Number(e.coordenadasEntrega && e.coordenadasEntrega.lat);
                const lng = Number(e.coordenadasEntrega && e.coordenadasEntrega.lng);
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

                const zonaSupermercado = e.supermercadoId && e.supermercadoId.localizacao ? e.supermercadoId.localizacao : '';
                const marker = L.circleMarker([lat, lng], {
                    radius: 6,
                    color: '#dc3545',
                    fillColor: '#dc3545',
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
            Object.keys(marcadoresSupermercados).forEach(id => {
                const total = contagem[id] || 0;
                const m = marcadoresSupermercados[id];
                m.marker.setPopupContent(`
                    <div class="text-center">
                        <b>${m.nome}</b><br>
                        <span class="badge bg-dark">${total} encomendas disponíveis</span>
                    </div>
                `);
            });

            if (typeof window.aplicarFiltroZonaAtiva === 'function') {
                window.aplicarFiltroZonaAtiva();
            }
        }
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
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum) || !meuMapa) return;

    meuMapa.setView([latNum, lngNum], 16);

    const destino = marcadoresDestinos.find((m) => m.lat === latNum && m.lng === lngNum);
    if (destino) {
        destino.marker.openPopup();
    }
}


