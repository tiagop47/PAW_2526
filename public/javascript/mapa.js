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

function adicionarMercadoNoMapa(id, nome, lat, lon, raioKm) {
    const corPadrao = '#007bff';

    const marker = L.marker([lat, lon]).addTo(meuMapa);
    marker.bindPopup(`<b>${nome}</b><br><small>A carregar estado...</small>`);
    
    // Guardar marcador para acesso posterior
    marcadoresSupermercados[id] = {
        marker: marker,
        nome: nome,
        lat: lat,
        lon: lon
    };

    L.circle([lat, lon], {
        color: corPadrao,
        fillColor: corPadrao,
        fillOpacity: 0.1,
        radius: (raioKm * 1000) / 5
    }).addTo(meuMapa);
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
                adicionarMercadoNoMapa(m._id, m.nome, latM, lon, m.raioAtuacao || 5);
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

async function carregarEntregasDisponiveis() {
    try {
        const resposta = await fetch('/estafeta/api/entregas');
        const dados = await resposta.json();

        if (dados.sucesso && dados.entregas) {
            // Contar encomendas por supermercado
            const contagem = {};
            dados.entregas.forEach(e => {
                const sId = e.supermercadoId._id || e.supermercadoId;
                contagem[sId] = (contagem[sId] || 0) + 1;
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


