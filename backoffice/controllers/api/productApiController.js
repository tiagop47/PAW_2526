const supermarketService = require('../../services/supermarketService');

const productApiController = {};

/**
 * Listagem direta reutilizando o Service (Sem mapeamento manual)
 */
productApiController.getAllProducts = async function (req, res) {
    try {
        const { supermercado, nome } = req.query;

        if (nome) {
            const produtos = await supermarketService.compararProdutosPorNome(nome);
            return res.json(produtos);
        }

        const produtos = await supermarketService.listarProdutosGeral(supermercado);
        res.json(produtos);
    } catch (error) {
        console.error('Erro na API de produtos:', error);
        res.status(500).json({ error: 'Erro ao carregar produtos' });
    }
};

productApiController.getProductById = async function (req, res) {
    res.json(req.produto);
};

/**
 * Lista todos os produtos do catálogo partilhado
 */
productApiController.getCatalogo = async function (req, res) {
    try {
        const catalogo = await supermarketService.listarCatalogo();
        res.json(catalogo);
    } catch (error) {
        console.error('Erro na API de catálogo:', error);
        res.status(500).json({ error: 'Erro ao carregar catálogo' });
    }
};

module.exports = productApiController;
