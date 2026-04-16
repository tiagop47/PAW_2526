const supermarketService = require('../../services/supermarketService');

const productApiController = {};

/**
 * Listagem direta reutilizando o Service (Sem mapeamento manual)
 */
productApiController.getAllProducts = async function (req, res) {
    try {
        // O Angular envia ?supermercado=ID
        const { supermercado } = req.query;

        const produtos = await supermarketService.listarProdutosGeral(supermercado);
        res.json(produtos);
    } catch (error) {
        console.error('Erro na API de produtos:', error);
        res.status(500).json({ error: 'Erro ao carregar produtos' });
    }
};

productApiController.getProductById = async function (req, res) {
    try {
        const p = await supermarketService.obterProdutoPorId(req.params.id);
        if (!p) return res.status(404).json({ error: 'Não encontrado' });
        res.json(p);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao obter produto' });
    }
};

module.exports = productApiController;
