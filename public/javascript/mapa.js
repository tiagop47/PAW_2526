/**
 * Lógica Simplificada de Mapas - Foco em Áreas de Atuação (Círculos)
 */
const AppMapa = {
    map: null,

    init: function (elementId, center = [41.15, -8.61], zoom = 12) {
        const container = document.getElementById(elementId);
        if (!container) return;

        this.map = L.map(elementId).setView(center, zoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(this.map);

        this.configSincronizacao();
    },

    carregarSupermercados: async function () {
        try {
            const res = await fetch('/admin/api/mercados-ativos?limite=100');
            const data = await res.json();

            if (data.supermercados) {
                data.supermercados.forEach(s => {
                    if (s.localizacaoGeo && s.localizacaoGeo.coordinates) {
                        const [lon, lat] = s.localizacaoGeo.coordinates;
                        this.addArea(s.nome, lat, lon, s.raioAtuacao || 5);
                    }
                });
            }
        } catch (e) { console.error("Erro ao carregar rede:", e); }
    },

    addArea: function (nome, lat, lon, raioKm) {
        // Marcador simples sem popup complexo
        L.marker([lat, lon]).addTo(this.map).bindPopup(nome);

        // Círculo de Atuação (Área Y)
        L.circle([lat, lon], {
            color: '#6c757d', // Cinzento Bootstrap
            fillColor: '#6c757d',
            fillOpacity: 0.1,
            weight: 1,
            radius: (raioKm || 5) * 1000
        }).addTo(this.map);
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
