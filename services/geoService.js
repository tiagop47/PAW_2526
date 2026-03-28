const axios = require('axios');

/**
 * Serviço de Geocodificação e Localização utilizando a API da Open Charge Map (OCM).
 * Focado na lógica de Pontos de Interesse (POI) e áreas de influência.
 * Website: https://openchargemap.org/
 */

const geoService = {};
geoService.OCM_API_KEY = process.env.OCM_API_KEY;

geoService.getCoordinatesFromAddress = async function (address) {
    if (!address) return null;

    try {
        const response = await axios.get('https://api.openchargemap.io/v3/poi/', {
            params: {
                key: this.OCM_API_KEY,
                address: address,
                maxresults: 1,
                verbose: false
            }
        });

        if (response.data && response.data.length > 0) {
            const poi = response.data[0];
            const { Latitude, Longitude } = poi.AddressInfo;

            console.log(`OpenChargeMap localização para: ${address} [${Latitude}, ${Longitude}]`);

            return {
                type: 'Point',
                coordinates: [parseFloat(Longitude), parseFloat(Latitude)]
            };
        }

        console.warn(`OpenChargeMap não encontrou: "${address}".`);
        return null;

    } catch (error) {
        console.error('Erro ao contactar a API OpenChargeMap:', error.message);
        return null;
    }
};

/**
 * Geocodificação Inversa (Coordenadas -> Morada)
 * Centralizado aqui para evitar chamadas diretas à API externa nos outros serviços.
 */
geoService.reverseGeocode = async function (latitude, longitude) {
    if (!latitude || !longitude) return null;

    try {
        // Por agora mantém Nominatim, mas centralizado para fácil substituição futura
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        return data.display_name || null;
    } catch (error) {
        console.error('Erro no Reverse Geocoding:', error.message);
        return null;
    }
};

module.exports = geoService;
