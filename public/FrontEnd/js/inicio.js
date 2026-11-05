const entrar = document.getElementById("Entrar");
const overlay = document.getElementById("overlay");
const fechar = document.getElementById("fechar");

if (entrar && overlay) {
  entrar.addEventListener("click", () => {
    overlay.classList.add("active");
  });
}

if (fechar && overlay) {
  fechar.addEventListener("click", () => {
    overlay.classList.remove("active");
  });
}

// Redireciona para a página de cadastro
function Cadastro() {
  window.location.href = "../cadastro/Cadastro.html";
}

// Login Simulado - SOLUÇÃO DIRECTA PARA O 404
const formularioLogin = document.querySelector(".login-box");

if (formularioLogin) {
  formularioLogin.addEventListener("submit", (evento) => {
    evento.preventDefault(); 

    const campoUsuario = document.getElementById("usuario");
    const campoSenha = document.getElementById("senha");
    const botaoEntrar = document.getElementById("btnEntrar");

    const identificador = campoUsuario?.value.trim();
    const senha = campoSenha?.value;

    if (!identificador || !senha) {
      alert("Preencha seu e-mail ou usuário e sua senha.");
      return;
    }

    if (botaoEntrar) {
      botaoEntrar.disabled = true;
      botaoEntrar.textContent = "Entrando...";
    }

    alert("Login realizado com sucesso!");

    // Usando caminhos estritamente relativos com encodeURI.
    // Isso diz ao navegador: "Volte duas pastas a partir de onde você está agora"
    // Funciona perfeitamente tanto local quanto no GitHub Pages!
    window.location.href = encodeURI("../../FrontEnd Interno/home/home.html");
  });
}
