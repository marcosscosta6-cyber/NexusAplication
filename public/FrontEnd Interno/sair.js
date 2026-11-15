const sair = document.getElementById("Sair");
sair?.addEventListener("click", () => document.getElementById("overlay")?.classList.add("active"));
function nao() { document.getElementById("overlay")?.classList.remove("active"); }
async function sim() {
  try {
    const resposta = await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    if (!resposta.ok) throw new Error("Não foi possível encerrar a sessão.");
    window.location.href = "../../FrontEnd/inicio/index.html";
  } catch (erro) { alert(erro.message); }
}
