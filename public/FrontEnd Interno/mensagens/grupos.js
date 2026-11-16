import { api, e, aviso, usuarioAtual, data } from '/shared/ui.js';
import { formularioModal } from '/shared/modal.js';

export async function iniciar() {
  const chats = document.getElementById('listaChats'), corpo = document.getElementById('chat-mensagens');
  const form = document.getElementById('enviar-mensagem'), texto = form.elements.texto, enviar = form.querySelector('button');
  const cabecalho = document.getElementById('chat-cabecalho'), anteriores = document.getElementById('mensagens-anteriores');
  const container = document.querySelector('.mensagens-container');
  let selecionado = null, mensagens = [], versao = 0, carregando = false, consultando = false, enviando = false, permitido = false;
  const rascunhos = new Map();
  document.querySelector('.titulo-conversas h2').textContent = 'Equipes';
  cabecalho.innerHTML = '<div><h3>Selecione um grupo</h3><span>Converse com a equipe do seu projeto.</span></div>';
  const voltar = document.createElement('button'); voltar.id = 'voltar-conversas'; voltar.textContent = '← Equipes'; voltar.type = 'button';
  document.querySelector('.chat-area').prepend(voltar);
  voltar.addEventListener('click', () => { container.classList.remove('conversa-aberta'); chats.querySelector('.ativo')?.focus(); });
  async function listar() {
    const { grupos } = await api('/grupos');
    const html = grupos.map(g => '<button class="contato ' + (g.id === selecionado ? 'ativo' : '') + '" data-grupo="' + g.id + '"><span class="grupo-icone" aria-hidden="true"><i class="fa-solid fa-users"></i></span><div><h4>' + e(g.nome) + '</h4><p>' + e(g.mensagens[0]?.texto || 'Inicie a conversa com a equipe') + '</p></div></button>').join('') || '<p class="empty-state">Nenhum grupo ainda. O proprietário pode criar o grupo do projeto pelo botão +.</p><a class="nexus-proximo-passo" href="../projetos/projetos.html?aba=meus">Ver meus projetos →</a>';
    if (chats.innerHTML !== html) {
      const foco = chats.contains(document.activeElement) ? document.activeElement.dataset.grupo : null;
      chats.innerHTML = html;
      if (foco) chats.querySelector('[data-grupo="' + foco + '"]')?.focus();
    }
    if (selecionado && !grupos.some(g => g.id === selecionado)) {
      permitido = false; texto.disabled = enviar.disabled = true; mensagens = []; corpo.replaceChildren(); anteriores.hidden = true;
      cabecalho.textContent = 'Você não faz mais parte desta equipe.';
    }
  }
  function renderizar(rolar = false) {
    const fim = corpo.scrollHeight - corpo.scrollTop - corpo.clientHeight < 80;
    corpo.innerHTML = mensagens.map(m => '<div class="mensagem ' + (m.remetenteId === usuarioAtual.id ? 'enviada' : 'recebida') + '"><a class="grupo-autor nexus-text-link" href="../perfil/perfilUser.html?id=' + m.remetenteId + '">' + e(m.remetente.nome) + '</a>' + e(m.texto) + '<time datetime="' + e(m.dataCriacao) + '">' + data(m.dataCriacao) + '</time></div>').join('') || '<p class="empty-state">Ainda não há mensagens. Compartilhe a primeira ideia com a equipe!</p>';
    if (rolar || fim) corpo.scrollTop = corpo.scrollHeight;
  }
  function juntar(novas) {
    const ids = new Set(mensagens.map(m => m.id));
    mensagens.push(...novas.filter(m => !ids.has(m.id))); mensagens.sort((a, b) => a.id - b.id);
  }
  async function abrir(id) {
    if (selecionado) rascunhos.set(selecionado, texto.value);
    const token = ++versao; selecionado = id; carregando = true; permitido = false;
    texto.disabled = enviar.disabled = true; anteriores.hidden = true; mensagens = []; corpo.replaceChildren();
    container.classList.add('conversa-aberta'); cabecalho.textContent = 'Carregando grupo...';
    try {
      const dados = await api('/grupos/' + id); if (token !== versao) return;
      const g = dados.grupo;
      cabecalho.innerHTML = '<span class="grupo-icone" aria-hidden="true"><i class="fa-solid fa-users"></i></span><div><h3>' + e(g.nome) + '</h3><span>' + g.integrantes.length + ' integrantes · </span><a class="nexus-proximo-passo" href="../projetos/detalhe.html?id=' + g.projetoId + '">Ver projeto</a><details class="grupo-integrantes"><summary>Ver equipe</summary>' + g.integrantes.map(u => '<a class="nexus-text-link" href="../perfil/perfilUser.html?id=' + u.id + '">' + e(u.nome) + '</a>').join('') + '</details></div>';
      mensagens = dados.mensagens; anteriores.hidden = !dados.temMais; permitido = true;
      texto.value = rascunhos.get(id) || ''; texto.disabled = enviar.disabled = false;
      history.replaceState(null, '', '?grupo=' + id); renderizar(true); await listar();
    } catch (erro) { if (token === versao) { cabecalho.textContent = erro.message; aviso(erro.message); } }
    finally { if (token === versao) carregando = false; }
  }
  async function criar() {
    // Apenas projetos que pertencem ao usuário podem originar novos grupos.
    let pagina = 1, dados, projetos = [];
    do { dados = await api('/projetos?aba=meus&pagina=' + pagina++); projetos.push(...dados.projetos.filter(p => p.souDono)); } while (pagina <= dados.paginas);
    const { grupos } = await api('/grupos');
    projetos = projetos.filter(p => !grupos.some(g => g.projetoId === p.id));
    if (!projetos.length) {
      formularioModal({ titulo: 'Criar grupo de equipe', salvar: 'Fechar', conteudo: '<p>Você precisa ser proprietário de um projeto sem grupo. Cada projeto tem um grupo, acessível à equipe aceita.</p><a class="nexus-proximo-passo" href="../projetos/projetos.html?aba=meus">Ver ou criar projeto →</a>', aoSalvar: async () => {} }); return;
    }
    formularioModal({ titulo: 'Criar grupo de equipe', salvar: 'Criar grupo', conteudo: '<label>Nome do grupo<input name="nome" minlength="3" maxlength="120" required autofocus placeholder="Ex.: Equipe do protótipo"></label><label>Projeto<select name="projetoId">' + projetos.map(p => '<option value="' + p.id + '">' + e(p.nome) + '</option>').join('') + '</select></label><p>O proprietário e os integrantes com convite aceito terão acesso. A equipe é atualizada automaticamente pelo projeto.</p>', aoSalvar: async valores => {
      const { grupo } = await api('/grupos', { method: 'POST', body: { nome: valores.nome, projetoId: Number(valores.projetoId) } }); await abrir(grupo.id);
    } });
  }
  document.getElementById('btn-novo-chat').addEventListener('click', () => criar().catch(erro => aviso(erro.message)));
  chats.addEventListener('click', evento => { const alvo = evento.target.closest('[data-grupo]'); if (alvo) abrir(Number(alvo.dataset.grupo)); });
  anteriores.addEventListener('click', async () => {
    if (!mensagens.length || anteriores.disabled) return;
    const token = versao; anteriores.disabled = true;
    try { const dados = await api('/grupos/' + selecionado + '?antes=' + mensagens[0].id); if (token !== versao) return;
      const altura = corpo.scrollHeight, posicao = corpo.scrollTop; juntar(dados.mensagens); renderizar(); corpo.scrollTop = corpo.scrollHeight - altura + posicao; anteriores.hidden = !dados.temMais;
    } catch (erro) { aviso(erro.message); } finally { anteriores.disabled = false; }
  });
  form.addEventListener('submit', async evento => {
    evento.preventDefault(); const valor = texto.value.trim(); if (!permitido || !selecionado || !valor || enviando) return;
    const id = selecionado, token = versao; enviando = true; enviar.disabled = true;
    try { const { mensagem } = await api('/grupos/' + id + '/mensagens', { method: 'POST', body: { texto: valor } });
      if (token === versao) { juntar([mensagem]); if (texto.value.trim() === valor) texto.value = ''; rascunhos.set(id, texto.value); renderizar(true); texto.focus(); } await listar();
    } catch (erro) { aviso(erro.message); } finally { enviando = false; enviar.disabled = !permitido; }
  });
  async function atualizar() {
    if (consultando || carregando || enviando || document.hidden) return;
    consultando = true; const token = versao;
    try {
      if (selecionado && permitido) { const dados = await api('/grupos/' + selecionado + '?depois=' + (mensagens.at(-1)?.id || 0)); if (token !== versao) return; if (dados.mensagens.length) { juntar(dados.mensagens); renderizar(); } }
      await listar();
    } catch (erro) { if (token === versao) { if (erro.status === 404) { permitido = false; texto.disabled = enviar.disabled = true; corpo.replaceChildren(); cabecalho.textContent = erro.message; } aviso(erro.message); } }
    finally { consultando = false; }
  }
  await listar(); const id = Number(new URLSearchParams(location.search).get('grupo'));
  if (Number.isInteger(id) && id > 0) await abrir(id);
  const timer = setInterval(atualizar, 4000); window.addEventListener('pagehide', () => clearInterval(timer), { once: true });
}
