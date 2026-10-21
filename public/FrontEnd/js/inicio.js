
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

// Login
const formularioLogin = document.querySelector(".login-box");

if (formularioLogin) {
  formularioLogin.addEventListener("submit", async (evento) => {
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

    try {
      const resposta = await fetch(
        "http://localhost:3000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            identificador,
            senha,
          }),
        }
      );

      const resultado = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          resultado.mensagem || "Não foi possível entrar."
        );
      }

      alert("Login realizado com sucesso!");

      window.location.href =
        "../../FrontEnd Interno/home/home.html";
    } catch (erro) {
      alert(
        erro.message ||
          "Não foi possível conectar ao servidor."
      );
    } finally {
      if (botaoEntrar) {
        botaoEntrar.disabled = false;
        botaoEntrar.textContent = "Entrar";
      }
    }
  });
}
