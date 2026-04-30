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

supermercadoApiController.getCupoes = async function (req, res) {
    try {
        const cupoes = await supermarketService.getCupoesSupermercado(req.supermercado._id);
        res.json(cupoes);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao carregar cupões' });
    }
}

supermercadoApiController.getSupermercadoById = async function (req, res) {
    res.json(req.supermercado);
}

supermercadoApiController.getMetodosCusto = async function (req, res) {
    try {
        const metodosPreco = await supermarketService.getMetodosCusto(req.supermercado);
        res.json(metodosPreco);
    } catch {
        res.status(500).json({ error: 'Erro ao carregar métodos de preço' });
    }
}

module.exports = supermercadoApiController;