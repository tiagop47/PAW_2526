const Coupon = require('../models/CupomModel');
const Supermarket = require('../models/SupermarketModel');

const cupaoService = {};

/**
 * Lista todos os cupões de um supermercado.
 * Usa o array 'cupoes' do supermercado como fonte de verdade.
 */
cupaoService.listarCupoes = async function (supermercadoId) {
    const supermercado = await Supermarket.findById(supermercadoId)
        .populate({
            path: 'cupoes',
            options: { sort: { criadoEm: -1 } }
        });

    return supermercado ? supermercado.cupoes : [];
};

/**
 * Cria um novo cupão e regista-o no array do supermercado.
 */
cupaoService.criarCupao = async function (supermercadoId, dados) {
    if (dados.codigo) {
        dados.codigo = dados.codigo.toUpperCase().trim();
    }

    const novoCupao = await Coupon.create(dados);

    // Guardar referência no supermercado
    await Supermarket.findByIdAndUpdate(
        supermercadoId,
        { $push: { cupoes: novoCupao._id } }
    );

    return novoCupao;
};

/**
 * Desativa um cupão — verifica primeiro que o cupão pertence ao supermercado.
 */
cupaoService.desativarCupao = async function (supermercadoId, cupaoId) {
    await _verificarPosse(supermercadoId, cupaoId);
    return Coupon.findByIdAndUpdate(cupaoId, { ativo: false }, { new: true });
};

/**
 * Ativa um cupão — verifica primeiro que o cupão pertence ao supermercado.
 */
cupaoService.ativarCupao = async function (supermercadoId, cupaoId) {
    await _verificarPosse(supermercadoId, cupaoId);
    return Coupon.findByIdAndUpdate(cupaoId, { ativo: true }, { new: true });
};

/**
 * Elimina um cupão e remove a referência do supermercado.
 */
cupaoService.eliminarCupao = async function (supermercadoId, cupaoId) {
    await _verificarPosse(supermercadoId, cupaoId);

    await Coupon.findByIdAndDelete(cupaoId);

    await Supermarket.findByIdAndUpdate(
        supermercadoId,
        { $pull: { cupoes: cupaoId } }
    );
};

/**
 * Verifica que o cupaoId pertence ao supermercado — protege contra acesso cruzado.
 */
async function _verificarPosse(supermercadoId, cupaoId) {
    const supermercado = await Supermarket.findOne({
        _id: supermercadoId,
        cupoes: cupaoId
    });

    if (!supermercado) {
        throw new Error('Cupão não encontrado ou não pertence a este supermercado.');
    }
}

module.exports = cupaoService;
