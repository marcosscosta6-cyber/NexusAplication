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

// Login Simulado - Código Corrigido para o GitHub Pages
const formularioLogin = document.querySelector(".login-box");

if (formularioLogin) {
  formularioLogin.addEventListener("submit", (evento) => {
    evento.preventDefault(); // Impede o envio real para o localhost

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

    // Pega o nome do repositório dinamicamente no GitHub Pages
    const pathParts = window.location.pathname.split('/');
    const repoName = pathParts[1]; 

    if (window.location.hostname.includes("github.io")) {
      // O encodeURI corrige o espaço em "FrontEnd Interno" para "FrontEnd%20Interno"
      window.location.href = encodeURI(`/${repoName}/FrontEnd Interno/home/home.html`);
    } else {
      // Se você estiver testando localmente na sua máquina (Live Server)
      window.location.href = "../../FrontEnd Interno/home/home.html";
    }
  });
}
