const entrar = document.getElementById("Entrar");

const overlay = document.getElementById("overlay");

const fechar = document.getElementById("fechar");

const cadastrar = document.getElementById("Cadastro");

// ABRIR
entrar.addEventListener("click", () => {

    overlay.classList.add("active");

});


// FECHAR
fechar.addEventListener("click", () => {

    overlay.classList.remove("active");

});


// Botão de cadastro levar para link 
function Cadastro() {
      window.location.href = "../cadastro/Cadastro.html";
    }

    // Botão para levar para o DashBoard
    function DashBoard() {
      window.location.href = "../home/home.html";
    }