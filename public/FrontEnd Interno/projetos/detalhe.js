import { api, e, aviso, usuarioAtual, fotoSrc } from '/shared/ui.js';
import { formularioModal } from '/shared/modal.js';
import { editarProjeto, statusProjeto } from './projetos.js';

export async function iniciar() {
  const id = Number(new URLSearchParams(location.search).get('id'));
  if (!Number.isInteger(id) || id <= 0) { document.querySelector('.project-grid').hidden = true; document.getElementById('editProject').hidden = true; return; }
  let projeto;
  let grupoEquipe;
  const chatEquipe = document.createElement('button'); chatEquipe.type = 'button'; chatEquipe.className = 'button secondary'; chatEquipe.hidden = true;
  document.querySelector('.project-heading').appendChild(chatEquipe);
  chatEquipe.addEventListener('click', async () => {
    chatEquipe.disabled = true;
    try {
      const grupo = grupoEquipe || (await api('/grupos', { method: 'POST', body: { projetoId: id } })).grupo;
      location.href = '../mensagens/mensagens.html?grupo=' + grupo.id;
    } catch (erro) { aviso(erro.message); } finally { chatEquipe.disabled = false; }
  });
  const equipe = document.createElement('div'); equipe.id = 'equipe-projeto'; document.querySelector('.team-intro').after(equipe);
  const etapas = document.createElement('div'); etapas.id = 'etapas-projeto'; document.getElementById('addMilestone').closest('section').appendChild(etapas);
  async function carregar() {
    projeto = (await api('/projetos/' + id)).projeto;
    grupoEquipe = (await api('/grupos')).grupos.find(g => g.projetoId === id);
    chatEquipe.hidden = !(projeto.souDono || (projeto.souMembro && grupoEquipe));
    chatEquipe.textContent = grupoEquipe ? 'Chat da equipe' : 'Criar chat da equipe';
    document.title = projeto.nome + ' — Nexus';
    const heading = document.querySelector('.heading-copy');
    heading.replaceChildren();
    const eyebrow = document.createElement('div'); eyebrow.className = 'eyebrow'; eyebrow.textContent = statusProjeto[projeto.status] + ' · Criado em ' + new Date(projeto.dataCriacao).toLocaleDateString('pt-BR');
    const titulo = document.createElement('h1'); titulo.textContent = projeto.nome;
    const resumo = document.createElement('p'); resumo.textContent = projeto.publico ? 'Projeto público da comunidade' : 'Projeto privado da equipe'; heading.append(eyebrow, titulo, resumo);
    document.getElementById('descriptionView').textContent = projeto.descricao; document.getElementById('descriptionView').style.whiteSpace = 'pre-wrap';
    const listaTags = document.getElementById('tagsList'); listaTags.innerHTML = projeto.tags.map(t => '<span class="tag">' + e(t) + (projeto.souDono ? ' <button data-tag="' + e(t) + '" aria-label="Remover tag ' + e(t) + '">×</button>' : '') + '</span>').join('') || '<p class="muted">Nenhuma tag informada.</p>';
    const membros = [ { usuario: projeto.proprietario, proprietario: true, aceita: true }, ...projeto.participantes ];
    equipe.innerHTML = membros.map(m => '<div class="member"><img class="avatar violet" src="' + e(fotoSrc(m.usuario)) + '" alt=""><div class="member-info"><b><a class="nexus-text-link" href="../perfil/perfilUser.html?id=' + m.usuario.id + '">' + e(m.usuario.nome) + '</a>' + (m.usuario.id === usuarioAtual.id ? ' <span class="you-label">Você</span>' : '') + '</b><small>' + (m.proprietario ? 'Proprietário(a)' : m.aceita ? 'Integrante' : 'Convite pendente') + '</small></div>' + (projeto.souDono && !m.proprietario ? '<button class="more-button" data-remover="' + m.usuario.id + '" aria-label="Remover ' + e(m.usuario.nome) + '"><i class="fa-solid fa-xmark"></i></button>' : '') + '</div>').join('');
    document.querySelector('.team-panel .count').textContent = membros.filter(m => m.aceita).length;
    etapas.innerHTML = projeto.etapas.map(etapa => '<div class="milestone"><span class="milestone-check ' + (etapa.concluida ? 'done' : '') + '" ' + (projeto.souDono ? 'role="checkbox" tabindex="0" aria-label="Concluir etapa ' + e(etapa.titulo) + '" aria-checked="' + etapa.concluida + '" data-etapa="' + etapa.id + '"' : '') + '>' + (etapa.concluida ? '<i class="fa-solid fa-check"></i>' : '') + '</span><div><b>' + e(etapa.titulo) + '</b></div><span class="milestone-status ' + (etapa.concluida ? 'done-text' : 'progress-text') + '">' + (etapa.concluida ? 'Concluída' : 'Em andamento') + '</span></div>').join('') || '<p class="muted">Nenhuma etapa criada.</p>';
    for (const seletor of ['#editProject', '#editDescription', '#editDetails', '#inviteMember', '#inviteMemberBottom', '#addMilestone', '#tagForm']) document.querySelector(seletor).hidden = !projeto.souDono;
    const detalhes = document.querySelector('.details-panel'); detalhes.querySelectorAll('.detail-row').forEach(el => el.remove());
    const linhas = [['Visibilidade', projeto.publico ? 'Público' : 'Privado'], ['Status', statusProjeto[projeto.status]], ['Última atualização', new Date(projeto.dataAtualizacao).toLocaleString('pt-BR')]];
    for (const [rotulo, valor] of linhas) { const linha = document.createElement('div'); linha.className = 'detail-row'; const span = document.createElement('span'); span.textContent = rotulo; const b = document.createElement('b'); b.textContent = valor; linha.append(span, b); detalhes.appendChild(linha); }
    const nota = document.querySelector('.owner-note'); nota.hidden = !projeto.souDono; nota.querySelector('b').textContent = 'Você é o(a) proprietário(a)';
    let sair = document.getElementById('sair-projeto');
    if (!projeto.souDono && projeto.souMembro && !sair) { sair = document.createElement('button'); sair.id = 'sair-projeto'; sair.className = 'button secondary'; sair.textContent = 'Sair da equipe'; sair.addEventListener('click', () => formularioModal({ titulo: 'Sair da equipe', conteudo: '<p>Você perderá o acesso ao projeto se ele for privado.</p>', salvar: 'Sair', aoSalvar: async () => { await api('/projetos/' + id + '/sair', { method: 'POST' }); location.href = 'projetos.html'; } })); document.querySelector('.project-heading').appendChild(sair); }
  }
  const editar = () => editarProjeto(projeto, async () => { await carregar(); aviso('Projeto atualizado.', 'sucesso'); });
  for (const seletor of ['#editProject', '#editDescription', '#editDetails']) document.querySelector(seletor).addEventListener('click', editar);
  async function convidar() {
    const conexoes = (await api('/conexoes')).conexoes;
    const ocupados = new Set([projeto.proprietarioId, ...projeto.participantes.map(p => p.usuarioId)]);
    const pessoas = conexoes.map(c => c.solicitanteId === usuarioAtual.id ? c.destinatario : c.solicitante).filter(u => !ocupados.has(u.id));
    if (!pessoas.length) { aviso('Nenhuma conexão disponível para convidar. Conecte-se com pessoas em Explorar.'); return; }
    formularioModal({ titulo: 'Convidar integrante', salvar: 'Enviar convite', conteudo: '<label>Conexão<select name="usuarioId">' + pessoas.map(u => '<option value="' + u.id + '">' + e(u.nome) + '</option>').join('') + '</select></label><p>A pessoa precisa aceitar o convite para entrar na equipe.</p>', aoSalvar: async dados => { await api('/projetos/' + id + '/convites', { method: 'POST', body: { usuarioId: Number(dados.usuarioId) } }); await carregar(); aviso('Convite enviado.', 'sucesso'); } });
  }
  for (const seletor of ['#inviteMember', '#inviteMemberBottom']) document.querySelector(seletor).addEventListener('click', () => convidar().catch(err => aviso(err.message)));
  equipe.addEventListener('click', evento => { const b = evento.target.closest('[data-remover]'); if (!b) return; formularioModal({ titulo: 'Remover integrante', salvar: 'Remover', conteudo: '<p>O integrante ou convite será removido deste projeto.</p>', aoSalvar: async () => { await api('/projetos/' + id + '/participantes/' + b.dataset.remover, { method: 'DELETE' }); await carregar(); } }); });
  document.getElementById('addMilestone').addEventListener('click', () => formularioModal({ titulo: 'Nova etapa', conteudo: '<label>Título da etapa<input name="titulo" minlength="3" maxlength="160" required autofocus></label>', salvar: 'Criar etapa', aoSalvar: async dados => { await api('/projetos/' + id + '/etapas', { method: 'POST', body: dados }); await carregar(); } }));
  const alternarEtapa = async evento => { const alvo = evento.target.closest('[data-etapa]'); if (!alvo || alvo.dataset.ocupada) return; alvo.dataset.ocupada = 'true'; try { await api('/projetos/' + id + '/etapas/' + alvo.dataset.etapa, { method: 'PATCH', body: { concluida: alvo.getAttribute('aria-checked') !== 'true' } }); await carregar(); } catch (erro) { delete alvo.dataset.ocupada; aviso(erro.message); } };
  etapas.addEventListener('click', alternarEtapa); etapas.addEventListener('keydown', evento => { if (evento.key === ' ' || evento.key === 'Enter') { evento.preventDefault(); alternarEtapa(evento); } });
  document.getElementById('tagForm').addEventListener('submit', async evento => { evento.preventDefault(); const input = document.getElementById('tagInput'); const tag = input.value.trim(); if (!tag) return; try { await api('/projetos/' + id, { method: 'PATCH', body: { tags: [...projeto.tags, tag] } }); input.value = ''; await carregar(); } catch (erro) { aviso(erro.campos?.map(c => c.mensagem).join(' ') || erro.message); } });
  document.getElementById('tagsList').addEventListener('click', async evento => { const b = evento.target.closest('[data-tag]'); if (!b) return; try { await api('/projetos/' + id, { method: 'PATCH', body: { tags: projeto.tags.filter(t => t !== b.dataset.tag) } }); await carregar(); } catch (erro) { aviso(erro.message); } });
  try { await carregar(); } catch (erro) { document.querySelector('.project-grid').hidden = true; document.getElementById('editProject').hidden = true; throw erro; }
}
