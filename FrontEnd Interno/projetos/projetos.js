
  function trocarAba(el, aba) {
        document.querySelectorAll('.aba').forEach(a => a.classList.remove('active'));
        el.classList.add('active');

        const lista = document.getElementById('lista-projetos');

        if (aba === 'explorar') {
            lista.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-folder-open"></i>
                    <p>Explore projetos abertos para colaboração em breve.</p>
                </div>
            `;
        } else {
            location.reload();
        }
    }