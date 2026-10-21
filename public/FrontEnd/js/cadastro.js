function voltar() {
     window.location.href = "../inicio/index.html";
}

const formulario = document.querySelector("form");

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const botao = document.querySelector("#cadastrar");
  const dados = new FormData(formulario);

  botao.disabled = true;

  try {
    const resposta = await fetch("http://localhost:3000/api/usuarios", {
      method: "POST",
      body: dados,
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
      const detalhes = resultado.erros
        ?.map((erro) => erro.mensagem)
        .join("\n");

      throw new Error(detalhes || resultado.mensagem || "Erro no cadastro.");
    }

    alert(resultado.mensagem);
    formulario.reset();
  } catch (erro) {
    alert(erro.message || "Não foi possível conectar à API.");
  } finally {
    botao.disabled = false;
  }
});
