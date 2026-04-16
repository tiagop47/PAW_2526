const supermarketService = require('../../services/supermarketService');

const productApiController = {};

/**
 * Listagem direta reutilizando o Service (Sem mapeamento manual)
 */
productApiController.getAllProducts = async (req, res) => {
    try {
        const produtos = await supermarketService.listarProdutosGeral();
        res.json(produtos);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao carregar produtos' });
    }
};

productApiController.getProductById = async (req, res) => {
    try {
        const p = await supermarketService.listarProdutosGeral({ _id: req.params.id });
        if (!p[0]) return res.status(404).json({ error: 'Não encontrado' });
        res.json(p[0]);
    } catch (error) {
        res.status(500).json({ error: 'Erro' });
    }
};

module.exports = productApiController;
