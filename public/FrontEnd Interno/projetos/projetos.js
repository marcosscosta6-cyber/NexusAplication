import { api, e, aviso, paginas } from '/shared/ui.js';
import { formularioModal } from '/shared/modal.js';

export const statusProjeto = { ATIVO: 'Ativo', PAUSADO: 'Pausado', CONCLUIDO: 'Concluído' };
export function editarProjeto(projeto, aoSalvar) {
  return formularioModal({
    titulo: projeto ? 'Editar projeto' : 'Novo projeto',
    salvar: projeto ? 'Salvar alterações' : 'Criar projeto',
    conteudo: '<label>Título<input name="nome" value="' + e(projeto?.nome || '') + '" minlength="3" maxlength="120" required autofocus></label>' +
      '<label>Descrição<textarea name="descricao" minlength="10" maxlength="5000" required placeholder="O que você quer construir e com quem gostaria de colaborar?">' + e(projeto?.descricao || '') + '</textarea></label>' +
      '<label>Tags <small>Opcional: até 8, separadas por vírgula.</small><input name="tags" value="' + e((projeto?.tags || []).join(', ')) + '" placeholder="Ex.: Web, Design, Automação"></label>' +
      '<label>Visibilidade<select name="publico"><option value="true" ' + (projeto?.publico !== false ? 'selected' : '') + '>Público — comunidade cadastrada</option><option value="false" ' + (projeto?.publico === false ? 'selected' : '') + '>Privado — somente a equipe</option></select></label>' +
      (projeto ? '<label>Status<select name="status">' + Object.entries(statusProjeto).map(([valor, texto]) => '<option value="' + valor + '" ' + (projeto.status === valor ? 'selected' : '') + '>' + texto + '</option>').join('') + '</select></label>' : ''),
    aoSalvar: async valores => {
      const dados = { ...valores, publico: valores.publico === 'true', tags: valores.tags.split(',').map(t => t.trim()).filter(Boolean) };
      const resultado = await api('/projetos' + (projeto ? '/' + projeto.id : ''), { method: projeto ? 'PATCH' : 'POST', body: dados });
      await aoSalvar(resultado.projeto);
    },
  });
}
export async function iniciar() {
  let aba = new URLSearchParams(location.search).get('aba') === 'explorar' ? 'explorar' : 'meus';
  document.querySelectorAll('button.aba[onclick]').forEach(b => { const ativa = b.getAttribute('onclick').includes("'" + aba + "'"); b.classList.toggle('active', ativa); b.setAttribute('aria-pressed', String(ativa)); });
  const lista = document.getElementById('lista-projetos');
  const nav = document.createElement('nav'); nav.setAttribute('aria-label', 'Páginas de projetos'); nav.hidden = true; lista.after(nav);
  const convites = document.createElement('div'); convites.id = 'convites-projetos'; lista.before(convites);
  async function carregar(pagina = 1) {
    const [dados, pendentes] = await Promise.all([api('/projetos?aba=' + aba + '&pagina=' + pagina), api('/projetos/convites')]);
    convites.innerHTML = pendentes.convites.map(c => '<div class="projeto-card convite-projeto" data-convite="' + c.projetoId + '"><div class="projeto-icon"><i class="fa-solid fa-envelope"></i></div><div class="projeto-info"><h3>' + e(c.projeto.nome) + '</h3><p>' + e(c.projeto.proprietario.nome) + ' convidou você para a equipe.</p></div><button class="btn-novo" data-responder="true">Aceitar</button><button class="aba" data-responder="false">Recusar</button></div>').join('');
    lista.innerHTML = dados.projetos.map(p => '<div class="projeto-card" role="link" tabindex="0" data-projeto="' + p.id + '"><div class="projeto-icon"><i class="fa-solid fa-folder"></i></div><div class="projeto-info"><h3>' + e(p.nome) + '</h3><p>' + e(p.descricao.length > 150 ? p.descricao.slice(0, 150) + '…' : p.descricao) + '</p><div class="projeto-tags">' + p.tags.map(t => '<span class="tag">' + e(t) + '</span>').join('') + '</div></div><div class="projeto-membros"><div class="membros-avatares">' + [p.proprietario, ...p.participantes.filter(m => m.aceita).map(m => m.usuario)].slice(0, 4).map(u => '<div class="membro-avatar" title="' + e(u.nome) + '">' + e(u.nome.split(/\s+/).slice(0, 2).map(t => t[0]).join('')) + '</div>').join('') + '</div></div><div class="projeto-status"><span class="status-badge status-' + (p.status === 'CONCLUIDO' ? 'concluido' : p.status === 'PAUSADO' ? 'pausado' : 'ativo') + '">● ' + statusProjeto[p.status] + '</span><span class="projeto-data">' + (p.publico ? 'Público' : 'Privado') + '</span></div></div>').join('') || '<div class="empty-state"><i class="fa-solid fa-folder-open"></i><p>' + (aba === 'meus' ? 'Você ainda não participa de projetos.' : 'Nenhum projeto público disponível.') + '</p></div>';
    nav.hidden = dados.paginas < 2; paginas(nav, dados.pagina, dados.paginas, p => carregar(p).catch(err => aviso(err.message)));
  }
  document.querySelector('.btn-novo').addEventListener('click', () => editarProjeto(null, projeto => { location.href = 'detalhe.html?id=' + projeto.id; }));
  window.trocarAba = (el, nova) => { aba = nova; history.replaceState(null, '', '?aba=' + aba); document.querySelectorAll('button.aba[onclick]').forEach(b => { b.classList.toggle('active', b === el); b.setAttribute('aria-pressed', String(b === el)); }); carregar().catch(err => aviso(err.message)); };
  const abrir = evento => { const card = evento.target.closest('[data-projeto]'); if (card) location.href = 'detalhe.html?id=' + card.dataset.projeto; };
  lista.addEventListener('click', abrir); lista.addEventListener('keydown', evento => { if (evento.key === 'Enter') abrir(evento); });
  convites.addEventListener('click', async evento => {
    const b = evento.target.closest('[data-responder]'); if (!b) return; b.disabled = true;
    try { const id = b.closest('[data-convite]').dataset.convite; const aceitar = b.dataset.responder === 'true'; await api('/projetos/' + id + '/convite', { method: 'PATCH', body: { aceitar } }); if (aceitar) location.href = 'detalhe.html?id=' + id; else await carregar(); }
    catch (erro) { b.disabled = false; aviso(erro.message); }
  });
  await carregar();
}
