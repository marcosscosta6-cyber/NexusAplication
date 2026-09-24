const tagList = document.getElementById('tagsList');
const toast = document.getElementById('toast');
let toastTimer;

function avisar(mensagem) {
    toast.textContent = mensagem;
    toast.classList.add('show');

    clearTimeout(toastTimer);

    toastTimer = setTimeout(
        () => toast.classList.remove('show'),
        2600
    );
}

function tagExiste(nome) {
    return [...tagList.querySelectorAll('.tag')].some(
        tag =>
            tag.firstChild.textContent.trim().toLocaleLowerCase() ===
            nome.toLocaleLowerCase()
    );
}

function criarTag(nome) {
    const tag = document.createElement('span');
    tag.className = 'tag';

    tag.append(document.createTextNode(nome + ' '));

    const remover = document.createElement('button');
    remover.type = 'button';
    remover.textContent = '×';
    remover.setAttribute('aria-label', `Remover ${nome}`);
    remover.dataset.remove = nome;

    tag.append(remover);
    tagList.append(tag);
}

tagList.addEventListener('click', event => {
    const button = event.target.closest('[data-remove]');

    if (!button) return;

    button.closest('.tag').remove();

    avisar(`Tag “${button.dataset.remove}” removida.`);
});

document.getElementById('tagForm').addEventListener('submit', event => {
    event.preventDefault();

    const input = document.getElementById('tagInput');
    const nome = input.value.trim();

    if (!nome) return;

    if (tagExiste(nome)) {
        avisar('Essa tag já foi adicionada.');
        return;
    }

    criarTag(nome);

    input.value = '';
    input.focus();

    avisar(`Tag “${nome}” adicionada.`);
});

document
    .querySelectorAll('#inviteMember,#inviteMemberBottom')
    .forEach(button =>
        button.addEventListener('click', () =>
            avisar('Convites de integrantes estarão disponíveis em breve.')
        )
    );

document
    .querySelectorAll('#editProject,#editDescription,#editDetails')
    .forEach(button =>
        button.addEventListener('click', () =>
            avisar('Edição de informações estará disponível em breve.')
        )
    );

document
    .getElementById('addMilestone')
    .addEventListener('click', () =>
        avisar('Criação de etapas estará disponível em breve.')
    );
