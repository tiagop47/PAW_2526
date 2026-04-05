const DASHBOARDS = {
    administrador: "/admin/dashboard",
    supermercados: "/supermercado/dashboard",
    estafetas: "/estafeta/dashboard",
    clientes: "/cliente/dashboard",
};

/**
 * Retorna a URL do dashboard baseada na role do utilizador.
 * @param {string} role 
 * @returns {string}
 */
function getDashboardUrl(role) {
    return DASHBOARDS[role] || "/auth/login";
}

module.exports = {
    getDashboardUrl
};
