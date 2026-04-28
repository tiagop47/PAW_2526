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

supermercadoApiController.getCategorias = async function (req, res) {
    try {
        const categorias = await supermarketService.listarCategorias();
        res.json(categorias);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao carregar categorias' });
    }
}

supermercadoApiController.getPromocoes = async function (req, res) {
    try {
        const dados = await supermarketService.obterPromocoesHome();
        res.json(dados);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao carregar promoções' });
    }
}

module.exports = supermercadoApiController;