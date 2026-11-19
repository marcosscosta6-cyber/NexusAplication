import { api, e, sessao, aviso, paginas, data } from '/shared/ui.js';
import { formularioModal } from '/shared/modal.js';
import { instalarBusca } from '/shared/busca.js';

async function iniciar() {
  const { usuario } = await api('/usuarios/me');
  if (!usuario.admin) { document.querySelector('main').innerHTML = '<h1>Acesso restrito</h1><p>Esta área é exclusiva da administração.</p>'; return; }
  sessao(usuario);
  const lista = document.getElementById('cadastros'), filtros = document.getElementById('filtros-admin'), nav = document.getElementById('paginacao-admin');
  let versao = 0, paginaAtual = 1;
  async function carregar(pagina = 1) {
    const token = ++versao; lista.setAttribute('aria-busy', 'true');
    try {
      const q = new URLSearchParams(new FormData(filtros)); q.set('pagina', pagina);
      const dados = await api('/admin/cadastros?' + q); if (token !== versao) return;
      paginaAtual = pagina;
      document.querySelectorAll('[data-contagem]').forEach(el => el.textContent = dados.contagens[el.dataset.contagem] || 0);
      lista.innerHTML = dados.usuarios.map(u => '<article class="admin-card"><div class="admin-dados"><h3>' + e(u.nome) + '</h3><p>@' + e(u.usuario) + ' · ' + e(u.email) + '</p><small>' + data(u.dataCadastro) + ' · ' + (u.temComprovante ? 'Comprovante enviado' : 'Sem comprovante') + '</small></div><span class="admin-status">' + e(u.situacao) + '</span><div class="admin-acoes">' + (u.temComprovante ? '<button type="button" class="admin-botao admin-botao-secundario" data-documento="' + u.id + '" aria-expanded="false">Ver documento</button>' : '') + (u.situacao === 'PENDENTE' ? '<button type="button" class="admin-botao admin-aprovar" data-aprovar="' + u.id + '"' + (u.temComprovante ? '' : ' disabled title="Comprovante obrigatório"') + '>Aprovar</button><button type="button" class="admin-botao admin-recusar" data-recusar="' + u.id + '" data-nome="' + e(u.nome) + '">Recusar</button>' : '') + '<button type="button" class="admin-botao admin-botao-secundario" data-analisar="' + u.id + '">Analisar cadastro</button></div></article>').join('') || '<p class="admin-vazio">Nenhum cadastro encontrado para estes filtros.</p>';
      nav.hidden = dados.paginas < 2; paginas(nav, dados.pagina, dados.paginas, p => carregar(p).catch(erro => aviso(erro.message)));
    } finally { if (token === versao) lista.removeAttribute('aria-busy'); }
  }
  filtros.addEventListener('submit', evento => { evento.preventDefault(); carregar().catch(erro => aviso(erro.message)); });
  filtros.elements.situacao.addEventListener('change', () => carregar().catch(erro => aviso(erro.message)));
  lista.addEventListener('click', async evento => {
    const documento = evento.target.closest('[data-documento]');
    if (documento) {
      const card = documento.closest('.admin-card');
      let painel = card.querySelector('.admin-documento');
      if (!painel) {
        painel = document.createElement('div');
        painel.className = 'admin-documento';
        const quadro = document.createElement('iframe');
        quadro.title = 'Comprovante de ' + card.querySelector('h3').textContent;
        quadro.src = '/api/admin/cadastros/' + encodeURIComponent(documento.dataset.documento) + '/comprovante';
        painel.appendChild(quadro);
        card.appendChild(painel);
      } else {
        painel.hidden = !painel.hidden;
      }
      documento.setAttribute('aria-expanded', String(!painel.hidden));
      documento.textContent = painel.hidden ? 'Ver documento' : 'Ocultar documento';
      return;
    }
    const aprovar = evento.target.closest('[data-aprovar]');
    if (aprovar) {
      aprovar.disabled = true;
      try { await api('/admin/cadastros/' + aprovar.dataset.aprovar, { method: 'PATCH', body: { situacao: 'APROVADO', motivo: '' } }); await carregar(paginaAtual); aviso('Cadastro aprovado.', 'sucesso'); }
      catch (erro) { aviso(erro.message); } finally { aprovar.disabled = false; }
      return;
    }
    const recusar = evento.target.closest('[data-recusar]');
    if (recusar) {
      formularioModal({ titulo: 'Recusar cadastro', salvar: 'Confirmar recusa', conteudo: '<p>Informe o motivo da recusa de <strong>' + e(recusar.dataset.nome) + '</strong>.</p><label>Motivo<textarea name="motivo" minlength="5" maxlength="1000" rows="3" required autofocus></textarea></label>', aoSalvar: async valores => { const motivo = valores.motivo.trim(); if (motivo.length < 5) throw new Error('Informe o motivo da recusa com pelo menos 5 caracteres.'); await api('/admin/cadastros/' + recusar.dataset.recusar, { method: 'PATCH', body: { situacao: 'RECUSADO', motivo } }); await carregar(paginaAtual); aviso('Cadastro recusado.', 'sucesso'); } });
      return;
    }
    const botao = evento.target.closest('[data-analisar]'); if (!botao) return; botao.disabled = true;
    try {
      const { usuario: u } = await api('/admin/cadastros/' + botao.dataset.analisar);
      formularioModal({ titulo: 'Analisar cadastro', salvar: 'Registrar decisão', conteudo:
        '<h3>' + e(u.nome) + '</h3><p>' + e(u.email) + ' · @' + e(u.usuario) + '</p><p>Situação atual: ' + e(u.situacao) + '</p>' +
        (u.temComprovante ? '<iframe class="admin-documento-modal" title="Comprovante de ' + e(u.nome) + '" src="/api/admin/cadastros/' + u.id + '/comprovante"></iframe><a class="admin-botao" href="/api/admin/cadastros/' + u.id + '/comprovante" target="_blank" rel="noopener">Abrir comprovante em outra aba ↗</a>' : '<p role="status">Este cadastro não possui comprovante disponível. Não pode ser aprovado.</p>') +
        '<label>Decisão<select name="situacao" required><option value="">Selecione</option>' + (u.temComprovante && u.situacao !== 'APROVADO' ? '<option value="APROVADO">Aprovar cadastro</option>' : '') + (u.situacao !== 'RECUSADO' ? '<option value="RECUSADO">Recusar cadastro</option>' : '') + '</select></label><label>Observação / motivo da recusa<textarea name="motivo" maxlength="1000" rows="3" placeholder="Obrigatório ao recusar"></textarea></label><details><summary>Histórico de análise</summary>' + (u.analisesRecebidas.map(a => '<p><strong>' + e(a.situacao) + '</strong> · ' + e(a.administrador.nome) + ' · ' + data(a.dataCriacao) + '<br>' + e(a.motivo || 'Sem observação') + '</p>').join('') || '<p>Nenhuma análise registrada.</p>') + '</details>',
        aoSalvar: async valores => { if (valores.situacao === 'RECUSADO' && valores.motivo.trim().length < 5) throw new Error('Informe o motivo da recusa com pelo menos 5 caracteres.'); await api('/admin/cadastros/' + u.id, { method: 'PATCH', body: valores }); await carregar(paginaAtual); aviso('Análise registrada.', 'sucesso'); },
      });
    } catch (erro) { aviso(erro.message); } finally { botao.disabled = false; }
  });
  document.getElementById('novo-admin').addEventListener('click', () => formularioModal({ titulo: 'Cadastrar administrador', salvar: 'Criar administrador', conteudo: '<p>Esta conta poderá visualizar documentos, analisar cadastros e criar outros administradores.</p><label>Nome<input name="nome" minlength="3" maxlength="120" required autofocus></label><label>Usuário<input name="usuario" minlength="3" maxlength="50" pattern="[a-zA-Z0-9_.\\-]+" autocomplete="off" required></label><label>E-mail<input name="email" type="email" maxlength="191" required></label><label>Senha<input name="senha" type="password" minlength="8" autocomplete="new-password" required></label><label>Confirmar senha<input name="confirmacao" type="password" autocomplete="new-password" required></label>', aoSalvar: async valores => { if (valores.senha !== valores.confirmacao) throw new Error('As senhas não coincidem.'); delete valores.confirmacao; await api('/admin/administradores', { method: 'POST', body: valores }); aviso('Administrador cadastrado.', 'sucesso'); } }));
  await carregar(); instalarBusca();
}
iniciar().catch(erro => { document.querySelector('main').innerHTML = '<h1>Administração</h1><p>' + e(erro.message) + '</p>'; aviso(erro.message); }).finally(() => { document.documentElement.dataset.sessao = 'pronta'; });
