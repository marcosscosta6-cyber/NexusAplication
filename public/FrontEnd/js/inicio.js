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

// Redireciona para a página de cadastro (Ajustado para caminhos relativos mais seguros)
function Cadastro() {
  window.location.href = "../cadastro/Cadastro.html";
}

// Login Simulado
const formularioLogin = document.querySelector(".login-box");

if (formularioLogin) {
  formularioLogin.addEventListener("submit", (evento) => {
    evento.preventDefault(); // Impede o envio real para um servidor

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

    // SIMULAÇÃO DE LOGIN: Removemos o fetch para o localhost!
    alert("Login realizado com sucesso!");

    // IMPORTANTE: Ajuste do caminho no GitHub Pages
    // Em vez de voltar várias pastas com ../../ que quebram a URL no GitHub,
    // usamos caminhos baseados na raiz do repositório.
    const pathParts = window.location.pathname.split('/');
    const repoName = pathParts[1]; // Pega o nome do seu repositório no GitHub Pages

    // Se estiver rodando no GitHub Pages, inclui o nome do repositório na URL
    if (window.location.hostname.includes("github.io")) {
      window.location.href = `/${repoName}/FrontEnd Interno/home/home.html`;
    } else {
      // Se você testar abrindo o arquivo direto no PC (Live Server)
      window.location.href = "../../FrontEnd Interno/home/home.html";
    }
  });
}
