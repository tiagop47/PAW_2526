let meuMapa;

function inicializarMapa(idElemento, lat = 41.15, lon = -8.61) {
    const container = document.getElementById(idElemento);
    if (!container) return;

    meuMapa = L.map(idElemento).setView([lat, lon], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(meuMapa);
}

function adicionarMercadoNoMapa(nome, lat, lon, raioKm, cor = '#007bff') {
    if (!meuMapa) return;

    // Adicionar o Marcador 
    L.marker([lat, lon]).addTo(meuMapa).bindPopup(`<b>${nome}</b>`);

    L.circle([lat, lon], {
        color: cor,
        fillColor: cor,
        fillOpacity: 0.2,
        radius: (raioKm * 1000) / 5
    }).addTo(meuMapa);
}

async function carregarMercadosDoServidor() {
    try {
        let rota = '/admin/api/mercados-ativos';
        if (location.pathname.includes('/estafeta')) {
            rota = '/estafeta/api/supermercados';
        }

        const resposta = await fetch(rota);
        const dados = await resposta.json();

        const mercados = dados.supermercados || dados.mercados || [];

        mercados.forEach(m => {
            if (m.localizacaoGeo && m.localizacaoGeo.coordinates) {
                const [lon, lat] = m.localizacaoGeo.coordinates;
                adicionarMercadoNoMapa(m.nome, lat, lon, m.raioAtuacao || 5);
            }
        });
    } catch (erro) {
        console.error("Erro ao carregar mercados:", erro);
    }
}

function desenharLocalizacaoEstafeta(lat, lon) {
    if (!meuMapa) {
        return;
    }

    L.circleMarker([lat, lon], {
        radius: 10,
        fillColor: "blue",
        color: "white",
        fillOpacity: 1
    }).addTo(meuMapa).bindPopup("A sua posição").openPopup();
}
