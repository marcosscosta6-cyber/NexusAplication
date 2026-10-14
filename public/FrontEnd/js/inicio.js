const entrar = document.getElementById("Entrar");

const overlay = document.getElementById("overlay");

const fechar = document.getElementById("fechar");

const cadastrar = document.getElementById("Cadastro");

const sairCadastro = document.getElementById("sair");

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


document.getElementById("btnEntrar").addEventListener("click", function(event) {
    event.preventDefault();

    window.location.href = "../../FrontEnd Interno/home/home.html";
});

// botão de sair da tela de cadastro 

function voltar() {
     window.location.href = "../inicio/index.html";
}