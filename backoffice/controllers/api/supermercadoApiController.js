const supermarketService = require('../../services/supermarketService');

const supermercadoApiController = {};

supermercadoApiController.getSupermercados = async function (req, res) {
    try {
        const supermercados = await supermarketService.getAllSupermercados();
        res.json(supermercados);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao carregar supermercados' });
    }
}

module.exports = supermercadoApiController;