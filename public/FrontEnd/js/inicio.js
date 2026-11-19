const entrar = document.getElementById("Entrar");
const overlay = document.getElementById("overlay");
const fechar = document.getElementById("fechar");

if (entrar && overlay) {
  entrar.addEventListener("click", () => {
    overlay.classList.add("active");
    overlay.setAttribute("aria-hidden", "false");
    document.getElementById("usuario")?.focus();
  });
}

function fecharLogin() {
  overlay.classList.remove("active");
  overlay.setAttribute("aria-hidden", "true");
  entrar?.focus();
}

if (fechar && overlay) {
  fechar.addEventListener("click", fecharLogin);
  overlay.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") { evento.preventDefault(); fecharLogin(); return; }
    if (evento.key !== "Tab") return;
    const elementos = [...overlay.querySelectorAll('button:not([disabled]), input:not([disabled]), a[href]')];
    const primeiro = elementos[0], ultimo = elementos[elementos.length - 1];
    if (evento.shiftKey && document.activeElement === primeiro) { evento.preventDefault(); ultimo.focus(); }
    else if (!evento.shiftKey && document.activeElement === ultimo) { evento.preventDefault(); primeiro.focus(); }
  });
}

// Redireciona para a página de cadastro
function Cadastro() {
  window.location.href = "../cadastro/Cadastro.html";
}

// Login com sessão autenticada na API
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
      const resposta = await fetch("/api/auth/login", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identificador, senha }),
      });
      const resultado = await resposta.json();
      if (!resposta.ok) throw new Error(resultado.mensagem);
      window.location.href = resultado.usuario.admin ? '/admin/index.html' : '../../FrontEnd Interno/home/home.html';
    } catch (erro) {
      alert(erro.message || "Não foi possível conectar à API.");
    } finally {
      if (botaoEntrar) { botaoEntrar.disabled = false; botaoEntrar.textContent = "Entrar"; }
    }
  });
}
