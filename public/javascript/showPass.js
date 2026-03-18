const input = document.getElementById("password");
const toggleBtn = document.getElementById("togglePassword");

toggleBtn.addEventListener("click", () => {
    if (input.getAttribute("type") === "password") {
        input.setAttribute("type", "text");
        toggleBtn.textContent = "Ocultar"; 
    } else {
        input.setAttribute("type", "password");
        toggleBtn.textContent = "Ver"; 
    }
});