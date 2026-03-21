/**
 * Lógica manual para a Navbar (Controlo do Menu Mobile e Dropdown)
 */
document.addEventListener("DOMContentLoaded", function() {
    
    // 1. Menu de Telemóvel (Hambúrguer)
    const botaoMenu = document.getElementById("botao-menu-mobile");
    const menuPrincipal = document.getElementById("menu-principal");

    if (botaoMenu && menuPrincipal) {
        botaoMenu.addEventListener("click", function() {
            menuPrincipal.classList.toggle("show");
        });
    }

    // 2. Dropdown do Utilizador (Olá, Nome)
    const linkUser = document.getElementById("link-utilizador");
    const listaDropdown = document.getElementById("lista-dropdown");

    if (linkUser && listaDropdown) {
        linkUser.addEventListener("click", function(e) {
            e.stopPropagation(); // Impede o clique de fechar logo a seguir
            listaDropdown.classList.toggle("show");
        });

        // Fechar se clicar fora
        window.addEventListener("click", function() {
            if (listaDropdown.classList.contains("show")) {
                listaDropdown.classList.remove("show");
            }
        });
    }

});
