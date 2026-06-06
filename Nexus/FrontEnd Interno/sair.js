const sair = document.getElementById("Sair")

// abrir a aba de sair

sair.addEventListener("click", () => {

 overlay.classList.add("active");

});

function nao() {
    window.location.href = "../home/home.html"
}

function sim() {
    window.location.href = "../.././FrontEnd/inicio/inicio.html"
}
