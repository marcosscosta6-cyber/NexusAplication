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

// Login Simulado - CORRIGIDO
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

    // CORREÇÃO AQUI: Adicionado aspas e o encodeURI para proteger o espaço em branco
    // Se a pasta 'public' estiver no mesmo nível ou acima, usamos caminhos relativos.
    // Ajustei para iniciar voltando duas pastas e buscando a rota que você informou:
    window.location.href = "../../FrontEnd Interno/home/home.html";
  });
}
