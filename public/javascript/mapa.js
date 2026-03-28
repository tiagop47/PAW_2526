// Variável global para aceder ao mapa em qualquer lado
let meuMapa;

// 1. Função simples para iniciar o mapa
function inicializarMapa(idElemento, lat = 41.15, lon = -8.61) {
    const container = document.getElementById(idElemento);
    if (!container) return;

    meuMapa = L.map(idElemento).setView([lat, lon], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(meuMapa);
}

// 2. Função para adicionar um Supermercado com a sua zona de entrega (Círculo)
function adicionarMercadoNoMapa(nome, lat, lon, raioKm, cor = '#007bff') {
    if (!meuMapa) return;

    // Adicionar o Marcador (o pino no mapa)
    L.marker([lat, lon]).addTo(meuMapa).bindPopup(`<b>${nome}</b>`);

    // Adicionar o Círculo (Zona de atuação) - Reduzimos o raio para ficar visualmente mais pequeno
    L.circle([lat, lon], {
        color: cor,
        fillColor: cor,
        fillOpacity: 0.2,
        radius: (raioKm * 1000) / 5 // Dividimos por 5 para o círculo ser menor no mapa
    }).addTo(meuMapa);
}

// 3. Função para ir buscar os mercados à base de dados
// Se estivermos na página do estafeta, usa a rota do estafeta. Se não, usa a do admin.
async function carregarMercadosDoServidor() {
    try {
        // Verificar em que página estamos para usar a rota certa
        let rota = '/admin/api/mercados-ativos';
        if (location.pathname.includes('/estafeta')) {
            rota = '/estafeta/api/supermercados';
        }

        const resposta = await fetch(rota);
        const dados = await resposta.json();
        
        // A API do estafeta e do admin podem devolver nomes diferentes (supermercados ou mercados)
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

// 4. Função para o mapa do estafeta (apenas um ponto azul)
function desenharLocalizacaoEstafeta(lat, lon) {
    if (!meuMapa) return;
    
    L.circleMarker([lat, lon], {
        radius: 10,
        fillColor: "blue",
        color: "white",
        fillOpacity: 1
    }).addTo(meuMapa).bindPopup("A sua posição").openPopup();
}
