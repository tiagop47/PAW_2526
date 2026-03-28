/**
 * Serviço de Localização - Apenas para converter morada em coordenadas (OCM)
 */
const geoService = {
    OCM_API_KEY: process.env.OCM_API_KEY,

    // Converte Morada em Coordenadas (Como nas aulas)
    getCoordinatesFromAddress: async function (morada) {
        if (!morada) return null;
        try {
            const url = `https://api.openchargemap.io/v3/poi/?key=${this.OCM_API_KEY}&address=${encodeURIComponent(morada)}&maxresults=1`;
            const resposta = await fetch(url);
            const dados = await resposta.json();

            if (dados && dados.length > 0) {
                const poi = dados[0];
                return {
                    type: 'Point',
                    coordinates: [parseFloat(poi.AddressInfo.Longitude), parseFloat(poi.AddressInfo.Latitude)]
                };
            }
            return null;
        } catch (erro) {
            return null;
        }
    }
};

module.exports = geoService;
