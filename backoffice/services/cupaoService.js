const Coupon = require('../models/CupomModel');
const Supermarket = require('../models/SupermarketModel');
const User = require('../models/UserModel');
const emailService = require('./emailService');

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
 * Distribui também o cupão aos clientes que têm este supermercado como favorito.
 */
cupaoService.criarCupao = async function (supermercadoId, dados) {
    if (dados.codigo) {
        dados.codigo = dados.codigo.toUpperCase().trim();
    }

    const novoCupao = await Coupon.create({
        ...dados,
        supermercadoId: supermercadoId
    });

    // Guardar referência no supermercado
    await Supermarket.findByIdAndUpdate(
        supermercadoId,
        { $push: { cupoes: novoCupao._id } }
    );

    // Associar cupão aos clientes que têm este supermercado como favorito
    await User.updateMany(
        { supermercadoFavorito: supermercadoId, role: 'clientes' },
        { $push: { cupoes: novoCupao._id } }
    );

    // Notificar esses clientes por email
    const clientes = await User.find({ supermercadoFavorito: supermercadoId, role: 'clientes' })
        .select('email')
        .lean();
    
    const emails = clientes.map(c => c.email);

    if (emails.length > 0) {
        // Envio assíncrono para não bloquear
        emailService.enviarEmailNovoCupao(emails, {
            codigo: novoCupao.codigo,
            desconto: novoCupao.percentagemDesconto
        });
    }

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
 * Elimina um cupão, remove a referência do supermercado e dos perfis dos utilizadores.
 */
cupaoService.eliminarCupao = async function (supermercadoId, cupaoId) {
    await _verificarPosse(supermercadoId, cupaoId);

    // Remove referência do cupão em todos os utilizadores
    await User.updateMany(
        { cupoes: cupaoId },
        { $pull: { cupoes: cupaoId } }
    );

    // Remove referência do supermercado
    await Supermarket.findByIdAndUpdate(
        supermercadoId,
        { $pull: { cupoes: cupaoId } }
    );

    // Elimina o cupão
    await Coupon.findByIdAndDelete(cupaoId);
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
