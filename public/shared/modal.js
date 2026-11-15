import { e } from './ui.js';

export function formularioModal({ titulo, conteudo, salvar = 'Salvar', aoSalvar, aoAbrir }) {
  const dialogo = document.createElement('dialog');
  dialogo.className = 'nexus-modal';
  const idTitulo = 'titulo-modal-' + crypto.randomUUID();
  dialogo.setAttribute('aria-labelledby', idTitulo);
  dialogo.innerHTML = '<div class="nexus-modal-cabecalho"><h2 id="' + idTitulo + '">' + e(titulo) + '</h2><button type="button" data-fechar aria-label="Fechar">×</button></div>' +
    '<form><div class="nexus-modal-campos">' + conteudo + '</div><p class="nexus-modal-erro" role="alert" hidden></p><div class="nexus-modal-acoes"><button type="button" class="nexus-cancelar" data-fechar>Cancelar</button><button type="submit" class="nexus-salvar">' + e(salvar) + '</button></div></form>';
  document.body.appendChild(dialogo);
  const form = dialogo.querySelector('form');
  const erroVisivel = dialogo.querySelector('[role=alert]');
  let enviando = false;
  const fechar = () => { if (!enviando) dialogo.close(); };
  dialogo.querySelectorAll('[data-fechar]').forEach(b => b.addEventListener('click', fechar));
  dialogo.addEventListener('cancel', evento => { if (enviando) evento.preventDefault(); });
  dialogo.addEventListener('close', () => dialogo.remove(), { once: true });
  form.addEventListener('submit', async evento => {
    evento.preventDefault();
    if (enviando) return;
    enviando = true;
    const botao = form.querySelector('[type=submit]');
    botao.disabled = true; erroVisivel.hidden = true;
    form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
    try {
      await aoSalvar(Object.fromEntries(new FormData(form)), form);
      enviando = false; dialogo.close();
    } catch (erro) {
      erroVisivel.textContent = erro.campos?.map(c => c.mensagem).join(' ') || erro.message;
      erroVisivel.hidden = false;
      for (const campo of erro.campos || []) form.elements.namedItem(campo.campo.split('.')[0])?.setAttribute('aria-invalid', 'true');
      form.querySelector('[aria-invalid]')?.focus();
    } finally { enviando = false; botao.disabled = false; }
  });
  dialogo.showModal();
  aoAbrir?.(form, dialogo);
  return dialogo;
}
