const axios = require('axios');

/**
 * Serviço de Geocodificação utilizando a API oficial do OpenWeatherMap.
 * Documentação: https://openweathermap.org/api/geocoding-api
 */

const API_KEY = process.env.OPENWEATHER_API_KEY;

/**
 * Obtém coordenadas (Latitude, Longitude) a partir de uma morada ou cidade.
 * 
 * @param {string} address - A morada (ex: "Porto, PT" ou "Lisboa, PT").
 * @returns {Promise<Object|null>} Objeto GeoJSON { type: 'Point', coordinates: [lon, lat] } ou null.
 */
async function getCoordinatesFromAddress(address) {
    if (!API_KEY) {
        console.error('ERRO: OPENWEATHER_API_KEY não configurada no ficheiro .env');
        return null;
    }

    if (!address || address.trim().length < 2) return null;

    try {
        // 1. Tentar Direct Geocoding (Pesquisa por Cidade/Região)
        // A API da OpenWeatherMap é otimizada para "City, Country"
        const response = await axios.get('http://api.openweathermap.org/geo/1.0/direct', {
            params: {
                q: address,
                limit: 1,
                appid: API_KEY
            }
        });

        if (response.data && response.data.length > 0) {
            const { lat, lon, name, state, country } = response.data[0];
            console.log(`OpenWeatherMap encontrou: ${name}, ${state || ''} ${country} [${lat}, ${lon}]`);

            return {
                type: 'Point',
                coordinates: [parseFloat(lon), parseFloat(lat)] // Formato [Longitude, Latitude] para MongoDB
            };
        }

        // 2. Fallback: Se a morada for complexa (Rua X, Cidade), tentar apenas com o que está após a vírgula
        if (address.includes(',')) {
            const partes = address.split(',');
            const cidade = partes[partes.length - 1].trim();
            console.warn(`Morada complexa detetada. Tentando fallback apenas com a cidade: ${cidade}`);
            return getCoordinatesFromAddress(cidade);
        }

        console.warn(`Nenhum resultado de localização para: "${address}"`);
        return null;

    } catch (error) {
        if (error.response) {
            // Erros da API (ex: 401 Unauthorized, 429 Limit Exceeded)
            console.error(`Erro API OpenWeatherMap (${error.response.status}):`, error.response.data.message || error.response.data);
        } else {
            console.error('Erro de rede/configuração ao contactar OpenWeatherMap:', error.message);
        }
        return null;
    }
}

/**
 * Obtém coordenadas a partir de um código postal.
 * Útil se o utilizador fornecer apenas o ZIP.
 */
async function getCoordinatesFromZip(zip, countryCode = 'PT') {
    if (!API_KEY) return null;

    try {
        const response = await axios.get('http://api.openweathermap.org/geo/1.0/zip', {
            params: {
                zip: `${zip},${countryCode}`,
                appid: API_KEY
            }
        });

        if (response.data) {
            const { lat, lon } = response.data;
            return {
                type: 'Point',
                coordinates: [parseFloat(lon), parseFloat(lat)]
            };
        }
    } catch (error) {
        console.error('Erro ao geocodificar ZIP com OpenWeatherMap:', error.message);
    }
    return null;
}

module.exports = {
    getCoordinatesFromAddress,
    getCoordinatesFromZip
};
