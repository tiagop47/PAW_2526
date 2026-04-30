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
        const encomenda = await req.encomenda.populate([
            { path: 'supermercadoId', select: 'nome localizacao' },
            { path: 'produtos.produtoId', select: 'nome imagem' },
            { path: 'estafetaId', select: 'nome telefone' }
        ]);
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
        const encomenda = await orderService.cancelarEncomenda(req.encomenda);
        res.json({ sucesso: true, encomenda });
    } catch (err) {
        res.status(400).json({ sucesso: false, erro: err.message });
    }
};

/**
 * POST /api/orders/:id/confirmar-rececao
 * O cliente confirma que recebeu a encomenda.
 */
orderApiController.confirmarRececao = async function (req, res) {
    try {
        const encomenda = await orderService.confirmarRececaoCliente(req.encomenda);
        res.json({ sucesso: true, message: 'Receção confirmada com sucesso.', encomenda });
    } catch (err) {
        res.status(400).json({ sucesso: false, erro: err.message });
    }
};

/**
 * POST /api/orders/validar-cupao
 * Valida um cupão para o supermercado atual.
 */
orderApiController.validarCupao = async function (req, res) {
    try {
        const clienteId = req.user.id;
        const { codigo, supermercadoId } = req.body;

        if (!codigo || !supermercadoId) {
            return res.status(400).json({ sucesso: false, erro: 'Código e supermercadoId são obrigatórios.' });
        }

        const Coupon = require('../../models/CupomModel');
        const User = require('../../models/UserModel');

        const cupao = await Coupon.findOne({ codigo: codigo.toUpperCase().trim(), ativo: true });
        
        if (!cupao) {
            return res.status(400).json({ sucesso: false, erro: 'Cupão inválido ou inativo.' });
        }

        if (new Date(cupao.prazo) < new Date()) {
            return res.status(400).json({ sucesso: false, erro: 'Este cupão já expirou.' });
        }

        if (cupao.supermercadoId && cupao.supermercadoId.toString() !== supermercadoId) {
            return res.status(400).json({ sucesso: false, erro: 'Este cupão não é válido para este supermercado.' });
        }

        const cliente = await User.findById(clienteId);
        if (!cliente.cupoes.includes(cupao._id)) {
            return res.status(400).json({ sucesso: false, erro: 'Não tens este cupão disponível na tua conta.' });
        }

        res.json({ 
            sucesso: true, 
            percentagemDesconto: cupao.percentagemDesconto,
            cupaoId: cupao._id 
        });
    } catch (err) {
        res.status(400).json({ sucesso: false, erro: err.message });
    }
};

module.exports = orderApiController;
