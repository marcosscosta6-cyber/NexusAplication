import { api, e, aviso, usuarioAtual, sessao, fotoSrc } from '/shared/ui.js';
import { formularioModal } from '/shared/modal.js';
import { areas, niveis, disponibilidades, cursos, estados } from '/shared/catalogo.js';

export async function iniciar() {
  const editar = local => formularioModal({
    titulo: local ? 'Indicar local' : 'Editar perfil',
    conteudo: local
      ? '<label>Estado<select name="localizacao">' + opcoes(estados, usuarioAtual.localizacao, true) + '</select></label>'
      : '<label>Nome<input name="nome" required minlength="3" maxlength="120" autocomplete="name" value="' + e(usuarioAtual.nome) + '" autofocus></label><label>Curso<select name="curso">' + opcoes(cursos, usuarioAtual.curso, true) + '</select></label><label>Biografia<textarea name="biografia" maxlength="2000" rows="4">' + e(usuarioAtual.biografia || '') + '</textarea></label><label>Foto de perfil<input name="foto" type="file" accept="image/png,image/jpeg"><small>Opcional. PNG ou JPG, até 2 MB. Sem selecionar uma imagem, a foto atual será mantida.</small></label>',
    aoSalvar: async valores => {
      const foto = valores.foto;
      delete valores.foto;
      if (foto?.size) {
        if (!['image/png', 'image/jpeg'].includes(foto.type)) throw new Error('Selecione uma foto PNG ou JPG.');
        if (foto.size > 2 * 1024 * 1024) throw new Error('A foto deve ter no máximo 2 MB.');
      }
      const resultado = await api('/usuarios/me', { method: 'PATCH', body: valores });
      sessao(resultado.usuario); atualizar();
      if (foto?.size) {
        const dados = new FormData(); dados.set('foto', foto);
        try {
          const resultadoFoto = await api('/usuarios/me/foto', { method: 'POST', body: dados });
          sessao({ ...usuarioAtual, fotoPerfil: resultadoFoto.fotoPerfil }); atualizar();
        } catch (erro) {
          throw new Error('Os dados do perfil foram salvos, mas a foto não foi atualizada. ' + erro.message);
        }
      }
      aviso(local ? 'Localização atualizada.' : 'Perfil atualizado.', 'sucesso');
    },
  });
  document.querySelector('.btn-editar-perfil').addEventListener('click', () => editar(false));
  const toggle = document.getElementById('mensagens-publicas');
  let alterandoMensagens = false;
  const linhaPrivacidade = [...document.querySelectorAll('.config-item')].find(item => item.querySelector('h4')?.textContent.trim() === 'Privacidade');
  function atualizar() {
    const avatar = document.querySelector('.perfil-config-avatar');
    avatar.style.backgroundImage = ''; avatar.textContent = usuarioAtual.nome.trim().split(/\s+/).slice(0, 2).map(t => t[0]).join('');
    if (usuarioAtual.fotoPerfil) { avatar.textContent = ''; avatar.style.backgroundImage = 'url("' + fotoSrc(usuarioAtual) + '")'; avatar.style.backgroundSize = 'cover'; }
    document.getElementById('conta-email').textContent = usuarioAtual.email;
    toggle.classList.toggle('on', usuarioAtual.mensagensPublicas); toggle.setAttribute('aria-checked', String(usuarioAtual.mensagensPublicas));
    toggle.closest('.config-item').querySelector('p').textContent = usuarioAtual.mensagensPublicas ? 'Qualquer usuário cadastrado pode enviar' : 'Apenas conexões aceitas podem enviar';
    linhaPrivacidade.querySelector('p').textContent = usuarioAtual.perfilPublico ? 'Perfil visível para a comunidade' : 'Perfil visível apenas para conexões';
    document.getElementById('resumo-atuacao').textContent = [usuarioAtual.funcao, areas[usuarioAtual.area], usuarioAtual.disponibilidade].filter(Boolean).join(' · ') || 'Área, função e disponibilidade';
  }
  async function salvarPreferencias(dados) {
    const resultado = await api('/configuracoes', { method: 'PATCH', body: dados });
    sessao(resultado.usuario); atualizar(); aviso('Preferências salvas.', 'sucesso');
  }
  async function alternarMensagens(evento) {
    evento.stopPropagation(); if (alterandoMensagens) return;
    alterandoMensagens = true; toggle.setAttribute('aria-busy', 'true');
    try { await salvarPreferencias({ mensagensPublicas: !usuarioAtual.mensagensPublicas }); }
    catch (erro) { aviso(erro.message); }
    finally { alterandoMensagens = false; toggle.removeAttribute('aria-busy'); }
  }
  toggle.addEventListener('click', alternarMensagens);
  toggle.addEventListener('keydown', evento => { if (evento.key === ' ' || evento.key === 'Enter') { evento.preventDefault(); alternarMensagens(evento); } });
  const opcoes = (valores, atual, vazio = false) => (vazio ? '<option value="">Não informado</option>' : '') + Object.entries(valores).map(([v, t]) => '<option value="' + e(v) + '" ' + (v === atual ? 'selected' : '') + '>' + e(t) + '</option>').join('');
  const escolhas = () => formularioModal({
    titulo: 'Privacidade',
    conteudo: '<label>Quem pode ver meu perfil<select name="perfilPublico"><option value="true" ' + (usuarioAtual.perfilPublico ? 'selected' : '') + '>Toda a comunidade cadastrada</option><option value="false" ' + (!usuarioAtual.perfilPublico ? 'selected' : '') + '>Somente conexões aceitas</option></select></label><label>Quem pode me enviar mensagens<select name="mensagensPublicas"><option value="false" ' + (!usuarioAtual.mensagensPublicas ? 'selected' : '') + '>Somente conexões aceitas</option><option value="true" ' + (usuarioAtual.mensagensPublicas ? 'selected' : '') + '>Qualquer usuário cadastrado</option></select></label><p>A regra de mensagens vale também para respostas em conversas existentes.</p>',
    aoSalvar: valores => salvarPreferencias({ perfilPublico: valores.perfilPublico === 'true', mensagensPublicas: valores.mensagensPublicas === 'true' }),
  });
  const seguranca = () => formularioModal({
    titulo: 'Alterar senha',
    conteudo: '<label>Senha atual<input name="senhaAtual" type="password" autocomplete="current-password" required autofocus></label><label>Nova senha<input name="novaSenha" type="password" minlength="8" autocomplete="new-password" required><small>Mínimo de 8 caracteres e até 72 bytes.</small></label><label>Confirmar nova senha<input name="confirmacao" type="password" autocomplete="new-password" required></label>',
    aoSalvar: async valores => { if (valores.novaSenha !== valores.confirmacao) throw new Error('As senhas não coincidem.'); if (new TextEncoder().encode(valores.novaSenha).length > 72) throw new Error('A senha deve ter até 72 bytes.'); await api('/configuracoes/senha', { method: 'PATCH', body: valores }); aviso('Senha atualizada.', 'sucesso'); },
  });
  const atuacao = () => formularioModal({
    titulo: 'Disponibilidade e atuação',
    conteudo: '<label>Função / ocupação<input name="funcao" maxlength="100" value="' + e(usuarioAtual.funcao || '') + '" placeholder="Ex.: Desenvolvedor(a)"></label><label>Área<select name="area">' + opcoes(areas, usuarioAtual.area, true) + '</select></label><label>Nível<select name="nivel">' + opcoes(Object.fromEntries(niveis.map(v => [v, v])), usuarioAtual.nivel, true) + '</select></label><label>Disponibilidade<select name="disponibilidade">' + opcoes(Object.fromEntries(disponibilidades.map(v => [v, v])), usuarioAtual.disponibilidade, true) + '</select></label><p>Essas informações são usadas pelos filtros em Explorar. Todos os campos são opcionais.</p>',
    aoSalvar: async valores => { const resultado = await api('/usuarios/me', { method: 'PATCH', body: valores }); sessao(resultado.usuario); atualizar(); aviso('Informações atualizadas.', 'sucesso'); },
  });
  const acessibilidade = () => formularioModal({
    titulo: 'Tamanho do texto',
    conteudo: '<label>Tamanho<select name="fonteAmpliada"><option value="false" ' + (!usuarioAtual.fonteAmpliada ? 'selected' : '') + '>Padrão</option><option value="true" ' + (usuarioAtual.fonteAmpliada ? 'selected' : '') + '>Ampliado</option></select></label>',
    aoSalvar: valores => salvarPreferencias({ fonteAmpliada: valores.fonteAmpliada === 'true' }),
  });
  const acoes = { 'Editar Perfil': () => editar(false), 'Indicar local': () => editar(true), 'Segurança': seguranca, 'Privacidade': escolhas, 'Acessibilidade': acessibilidade, 'Disponibilidade e atuação': atuacao, 'Sobre': () => formularioModal({ titulo: 'Sobre o Nexus', salvar: 'Fechar', conteudo: '<p>Nexus v1.0.0 — comunidade SENAI para conectar pessoas e desenvolver projetos em equipe.</p>', aoSalvar: async () => {} }) };
  for (const item of document.querySelectorAll('.config-item')) {
    const titulo = item.querySelector('h4')?.textContent.trim();
    if (acoes[titulo]) {
      item.setAttribute('role', 'button'); item.tabIndex = 0;
      item.addEventListener('click', acoes[titulo]); item.addEventListener('keydown', evento => { if (evento.target === item && (evento.key === 'Enter' || evento.key === ' ')) { evento.preventDefault(); acoes[titulo](); } });
    } else if (titulo === 'Enviar comentários') { item.setAttribute('aria-disabled', 'true'); item.title = 'Disponível em uma próxima etapa'; }
  }
  atualizar();
}
