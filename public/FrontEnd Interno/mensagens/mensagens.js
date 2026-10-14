//abre e fecha a barra de busca de usuários para iniciar um novo chat
const btnNovoChat = document.getElementById("btn-novo-chat");
const buscarUsuarios = document.getElementById("buscarUsuarios");

btnNovoChat.addEventListener("click", () => {
    buscarUsuarios.classList.toggle("ativo");
});

//adiciona o chat novo na lista de conversas ao clicar no usuário
const usuarios = document.querySelectorAll(".usuario-item");
const listaConversas = document.getElementById("listaChats");

usuarios.forEach(usuario => {

    usuario.addEventListener("click", () => {

        const nome = usuario.textContent;

        const existe = [...document.querySelectorAll(".contato h4")]
            .some(h4 => h4.textContent === nome);

        if(existe) return;

        const novaConversa = document.createElement("div");

        novaConversa.classList.add("contato");

        novaConversa.innerHTML = `
            <img src="../Img/download 3.svg">
            <div>
                <h4>${nome}</h4>
                <p>Nova conversa</p>
            </div>
        `;

        listaConversas.prepend(novaConversa);

        buscarUsuarios.classList.remove("ativo");


    });
});
