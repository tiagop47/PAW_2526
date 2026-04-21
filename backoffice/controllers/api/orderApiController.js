const orderService = require('../../services/orderService');

const orderApiController = {};

/**
 * POST /api/orders
 * Criar uma nova encomenda.
 * Body: { supermercadoId, produtos: [{ produtoId, quantidade }], metodoEntrega, moradaEntrega, coordenadasEntrega }
 */
orderApiController.criarEncomenda = async function (req, res) {
    try {
        const clienteId = req.user.id;
        const encomenda = await orderService.criarEncomenda(clienteId, req.body);
        res.status(201).json({ sucesso: true, encomenda });
    } catch (err) {
        res.status(400).json({ sucesso: false, erro: err.message });
    }
};

/**
 * GET /api/orders
 * Listar encomendas do cliente autenticado.
 */
orderApiController.listarEncomendas = async function (req, res) {
    try {
        const clienteId = req.user.id;
        const encomendas = await orderService.listarEncomendasCliente(clienteId);
        res.json({ sucesso: true, encomendas });
    } catch (err) {
        res.status(500).json({ sucesso: false, erro: err.message });
    }
};

/**
 * GET /api/orders/:id
 * Obter detalhes de uma encomenda.
 */
orderApiController.obterEncomenda = async function (req, res) {
    try {
        const clienteId = req.user.id;
        const encomenda = await orderService.obterEncomendaCliente(clienteId, req.params.id);
        if (!encomenda) {
            return res.status(404).json({ sucesso: false, erro: 'Encomenda não encontrada.' });
        }
        res.json({ sucesso: true, encomenda });
    } catch (err) {
        res.status(500).json({ sucesso: false, erro: err.message });
    }
};

/**
 * POST /api/orders/:id/cancelar
 * Cancelar uma encomenda (regra dos 5 minutos após confirmação).
 */
orderApiController.cancelarEncomenda = async function (req, res) {
    try {
        const clienteId = req.user.id;
        const encomenda = await orderService.cancelarEncomenda(clienteId, req.params.id);
        res.json({ sucesso: true, encomenda });
    } catch (err) {
        res.status(400).json({ sucesso: false, erro: err.message });
    }
};

module.exports = orderApiController;
