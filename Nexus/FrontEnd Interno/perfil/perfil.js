const overlayEditar = document.getElementById("overlayEditar");
const editar = document.getElementById("btnEditar");
const fechar = document.getElementById("btnFechar");

editar.addEventListener("click", () => {
    overlayEditar.style.display = "flex";
    overlayEditar.classList.add("active");

});

fechar.addEventListener("click", () => {
    overlayEditar.classList.remove("active");
});

// ===============================
// FOTO DE PERFIL
// ===============================

const inputFoto = document.getElementById("inputFotoPerfil");
const previewFoto = document.getElementById("previewFoto");

inputFoto.addEventListener("change", function(){

    const arquivo = this.files[0];

    if(!arquivo) return;

    previewFoto.src = URL.createObjectURL(arquivo);

});


// ===============================
// HABILIDADES
// ===============================

const inputSkill = document.getElementById("txtSkill");
const btnHabilidade = document.getElementById("btnHabilidade");
const listaSkills = document.getElementById("skills");

let habilidades = [];


btnHabilidade.addEventListener("click", function(e){

    e.preventDefault();

    adicionarHabilidade();

});


inputSkill.addEventListener("keydown", function(e){

    if(e.key === "Enter"){

        e.preventDefault();

        adicionarHabilidade();

    }

});


function adicionarHabilidade(){

    let texto = inputSkill.value.trim();

    if(texto === "") return;

    if(texto.length > 30){

        alert("A habilidade deve ter no máximo 30 caracteres.");

        return;

    }

    const habilidadeLower = texto.toLowerCase();

    if(habilidades.includes(habilidadeLower)){

        alert("Essa habilidade já foi adicionada.");

        return;

    }

    habilidades.push(habilidadeLower);

    const skill = document.createElement("div");

    skill.classList.add("skill");

    skill.innerHTML = `
        <span>${texto}</span>
        <button type="button">&times;</button>
    `;

    skill.querySelector("button").addEventListener("click", () => {

        habilidades = habilidades.filter(item => item !== habilidadeLower);

        skill.remove();

    });

    listaSkills.appendChild(skill);

    inputSkill.value = "";

    inputSkill.focus();

}
