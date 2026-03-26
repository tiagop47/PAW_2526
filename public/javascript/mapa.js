/**
 * Lógica de Mapas Centralizada - Foco em Áreas de Atuação (Círculos)
 */
const AppMapa = {
    map: null,
    markers: [],

    normalizarRaioKm: function (raioValor) {
        const raioNumero = Number(raioValor);
        if (!Number.isFinite(raioNumero) || raioNumero <= 0) return 5;

        const raioKm = raioNumero > 100 ? raioNumero / 1000 : raioNumero;
        return Math.min(Math.max(raioKm, 1), 50);
    },

    init: function (elementId, center = [41.15, -8.61], zoom = 12) {
        const container = document.getElementById(elementId);
        if (!container) return null;

        if (this.map) {
            this.map.remove();
        }

        this.map = L.map(elementId).setView(center, zoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(this.map);

        this.configSincronizacao();
        return this.map;
    },

    /**
     * Adiciona um marcador e um círculo de área de atuação centralizado.
     */
    addArea: function (nome, lat, lon, raioKm, options = {}) {
        if (!this.map) return null;

        const {
            color = '#6c757d',
            visual = false,
            popupContent = `<strong>${nome}</strong>`,
            weight = visual ? 1 : 2,
            opacity = 0.5,
            fillOpacity = 0.1
        } = options;

        const marker = L.marker([lat, lon]).addTo(this.map).bindPopup(popupContent);
        this.markers.push(marker);

        // Leaflet usa metros; guardamos o raio de negócio em km.
        const raioCalculado = this.normalizarRaioKm(raioKm) * 1000;

        return L.circle([lat, lon], {
            color: color,
            weight: weight,
            opacity: opacity,
            fillColor: color,
            fillOpacity: fillOpacity,
            radius: raioCalculado
        }).addTo(this.map);
    },

    /**
     * Carrega supermercados via API e desenha as áreas (Usado no Admin/Dashboard)
     */
    carregarSupermercados: async function (options = {}) {
        try {
            const endpoint = options.endpoint || '/admin/api/mercados-ativos?limite=100';
            const res = await fetch(endpoint);
            const data = await res.json();

            const mercados = data.supermercados || data.mercados || [];
            
            mercados.forEach(s => {
                if (s.localizacaoGeo && s.localizacaoGeo.coordinates) {
                    const [lon, lat] = s.localizacaoGeo.coordinates;
                    this.addArea(s.nome, lat, lon, s.raioAtuacao || 5, options);
                }
            });
        } catch (e) { console.error("Erro ao carregar rede:", e); }
    },

    /**
     * Adiciona marcador especial para o Estafeta (Usado na dashboard do estafeta)
     */
    addEstafeta: function (lat, lon) {
        if (!this.map) return;
        
        return L.circleMarker([lat, lon], {
            radius: 8,
            fillColor: "#007bff",
            color: "#fff",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(this.map).bindPopup('A sua localização').openPopup();
    },

    configSincronizacao: function () {
        const btn = document.getElementById('btn-sincronizar-geo');
        if (!btn) return;

        btn.addEventListener('click', async () => {
            btn.disabled = true;
            try {
                const res = await fetch('/admin/api/sincronizar-geo', { method: 'POST' });
                const data = await res.json();

                if (data.success) {
                    location.reload();
                }
            } catch (err) {
                alert('Erro na ligação.');
                btn.disabled = false;
            }
        });
    }
};
