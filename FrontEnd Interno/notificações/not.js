  function fechar(id) {
        const card = document.getElementById(id);
        card.style.opacity = '0';
        card.style.transform = 'translateX(20px)';
        card.style.transition = 'all .3s ease';
        setTimeout(() => {
            card.remove();
            checarVazio();
        }, 300);
    }

    function marcarTodasLidas() {
        document.querySelectorAll('.notif-card.nao-lida').forEach(card => {
            card.classList.remove('nao-lida');
            card.classList.add('lida');
            card.querySelector('.dot-nao-lida').className = 'dot-lida';
        });
    }

    function checarVazio() {
        const lista = document.getElementById('lista-notif');
        if (lista.children.length === 0) {
            lista.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-bell-slash"></i>
                    <h3>Tudo em dia!</h3>
                    <p>Você ainda não tem nenhuma notificação.</p>
                </div>
            `;
        }
    }