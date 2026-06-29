const area = document.getElementById("area");
const funcao = document.getElementById("funcao");

const funcoes = {

    aeronautica:[
        "Técnico em Manutenção Aeronáutica em Célula",
    ],

    gestao:[
        "Técnico em Planejamento e Controle da Produção",
        "Técnico em Qualidade",
        "Técnico em Admnistração"
    ],

    marketing:[
        "Técnico em Marketing",
        "Técnico em Multimídia"
    ],

    cultural:[
        "Técnico em Produção Cultural"
    ],

    eletro:[
        "Técnico em Sistemas de Energia Renovável",
        "Técnico em Eletrotécnica",
        "Técnico em Eletromecânica"
    ],

    automacao:[
        "Técnico em Automação Industrial",
        "Técnico em Manutenção Automotiva"
    ],

    tecnologia: [
        "Técnico em Desenvolvimento de Sistemas",
        "Técnico em Rede de Computadores"
    ],

    mecanica: [
        "Técnico em Mecânica",
        "Técnico em Manutenção de Máquinas Industriais",
        "Técnico em Mecatrônica",
        "Técnica em Eletromecânica"
    ],

    construcao: [
        "Técnico em Edificações",
        "Técnico em Segurança do Trabalho"
    ],

    quimica:[
        "Técnico em Petroquímica",
        "Técnico em Química",
    ],

    refrigeracao:[
        "Técnico em Refrigeração e Climatização"
    ],

    logistica: [
        "Técnico em Logística",
    ],

    seguranca:[
        "Técnico em Segurança do Trabalho"
    ],

};

area.addEventListener("change", function () {

    const areaEscolhida = area.value;

    funcao.innerHTML = '<option value="">Todas</option>';

    funcoes[areaEscolhida].forEach(item => {

        const option = document.createElement("option");

        option.value = item;
        option.textContent = item;

        funcao.appendChild(option);

    });

});

const btnPerfil = document.querySelectorAll(".btn-perfil");

btnPerfil.forEach(btnPerfil => {
    btnPerfil.addEventListener("click", function (){
        window.location.href = "../perfil/perfilUser.html";
    });
});

const btnConectar = document.querySelectorAll(".btn-conectar");

btnConectar.forEach(btnConectar=> {
    btnConectar.addEventListener("click", function (){
        window.location.href = "../conexões/conec.html";
    });
});
