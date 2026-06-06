   const dados = {
        todos: [
            { iniciais:'JL', nome:'Juliana Lima',    cargo:'Desenvolvedora Front-End', cidade:'São Paulo, SP' },
            { iniciais:'RC', nome:'Rafael Cruz',     cargo:'Dev Full Stack',           cidade:'Florianópolis, SC' },
            { iniciais:'AS', nome:'Ana Souza',       cargo:'Designer UX/UI',           cidade:'Recife, PE' },
            { iniciais:'LM', nome:'Lucas Moraes',    cargo:'Técnico em Elétrica',      cidade:'Belo Horizonte, MG' },
            { iniciais:'BN', nome:'Beatriz Nunes',   cargo:'Analista de Dados',        cidade:'Porto Alegre, RS' },
            { iniciais:'GO', nome:'Gabriel Oliveira',cargo:'Engenheiro de Produção',   cidade:'Campinas, SP' },
        ],
        solicitacoes: [
            { iniciais:'MC', nome:'Marcos Costa',   cargo:'Design',          msg:'quer se conectar' },
            { iniciais:'PF', nome:'Pedro Ferreira', cargo:'Dev Mobile',      msg:'quer se conectar' },
        ],
        enviados: [
            { iniciais:'TS', nome:'Thiago Santos',  cargo:'Engenheiro Civil',   msg:'Aguardando resposta' },
            { iniciais:'CM', nome:'Carla Mendes',   cargo:'Gestão de Projetos', msg:'Aguardando resposta' },
        ]
    };

    function renderTodos(lista) {
        return lista.map(p => `
            <div class="conexao-card">
                <div class="avatar">${p.iniciais}</div>
                <div class="conexao-info">
                    <h4>${p.nome}</h4>
                    <p>${p.cargo} · ${p.cidade}</p>
                </div>
                <div class="conexao-btns">
                    <button class="btn-mensagem"><i class="fa-solid fa-message"></i> Mensagem</button>
                    <button class="btn-remover">Remover</button>
                </div>
            </div>
        `).join('');
    }

    function renderSolicitacoes(lista) {
        return lista.map(p => `
            <div class="conexao-card" id="card-${p.iniciais}">
                <div class="avatar">${p.iniciais}</div>
                <div class="conexao-info">
                    <h4>${p.nome}</h4>
                    <p>${p.cargo}</p>
                </div>
                <div class="conexao-msg">
                    <span>${p.nome}</span> ${p.msg}:
                </div>
                <div class="conexao-btns">
                    <button class="btn-confirmar" onclick="confirmar('${p.iniciais}')">Confirmar</button>
                    <button class="btn-excluir"   onclick="excluir('${p.iniciais}')">Excluir</button>
                </div>
            </div>
        `).join('');
    }

    function renderEnviados(lista) {
        return lista.map(p => `
            <div class="conexao-card">
                <div class="avatar">${p.iniciais}</div>
                <div class="conexao-info">
                    <h4>${p.nome}</h4>
                    <p>${p.cargo}</p>
                </div>
                <div class="conexao-msg">
                    <span class="pendente-label">⏳ ${p.msg}</span>
                </div>
                <div class="conexao-btns">
                    <button class="btn-excluir">Cancelar</button>
                </div>
            </div>
        `).join('');
    }

    function trocarAba(el, aba) {
        document.querySelectorAll('.aba').forEach(a => a.classList.remove('active'));
        el.classList.add('active');
        const lista = document.getElementById('lista-conexoes');

        if (aba === 'todos')        lista.innerHTML = renderTodos(dados.todos);
        if (aba === 'solicitacoes') lista.innerHTML = renderSolicitacoes(dados.solicitacoes);
        if (aba === 'enviados')     lista.innerHTML = renderEnviados(dados.enviados);
    }

    function confirmar(id) {
        document.getElementById('card-' + id).remove();
    }

    function excluir(id) {
        document.getElementById('card-' + id).remove();
    }

    // carrega a aba solicitações por padrão
    trocarAba(document.querySelector('.aba.active'), 'solicitacoes');