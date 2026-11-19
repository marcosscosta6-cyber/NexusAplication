(() => {
  const chave = 'nexus-acessibilidade';
  const opcoes = [
    ['texto', 'Texto maior'],
    ['contraste', 'Contraste reforçado'],
    ['links', 'Destacar links'],
    ['movimento', 'Reduzir movimento'],
  ];
  let preferencias = {};
  try { preferencias = JSON.parse(localStorage.getItem(chave) || '{}') || {}; } catch { preferencias = {}; }
  function aplicar() {
    for (const [nome] of opcoes) document.documentElement.classList.toggle('acessibilidade-' + nome, preferencias[nome] === true);
  }
  aplicar();
  document.addEventListener('DOMContentLoaded', () => {
    const principal = document.querySelector('main');
    if (principal) {
      if (!principal.id) principal.id = 'conteudo-principal';
      principal.setAttribute('tabindex', '-1');
      const link = document.createElement('a');
      link.className = 'nexus-pular'; link.href = '#' + principal.id; link.textContent = 'Pular para o conteúdo principal';
      link.addEventListener('click', () => principal.focus());
      document.body.prepend(link);
    }
    const botao = document.createElement('button');
    botao.type = 'button'; botao.className = 'acessibilidade-abrir'; botao.textContent = 'Acessibilidade';
    botao.setAttribute('aria-expanded', 'false'); botao.setAttribute('aria-controls', 'painel-acessibilidade');
    const painel = document.createElement('section');
    painel.id = 'painel-acessibilidade'; painel.className = 'acessibilidade-painel'; painel.hidden = true;
    painel.setAttribute('aria-label', 'Opções de acessibilidade');
    painel.innerHTML = '<div class="acessibilidade-topo"><h2> Acessibilidade </h2><button type="button" class="acessibilidade-fechar" aria-label="Fechar opções de acessibilidade">×</button></div><p>Ajuste a visualização conforme sua preferência.</p><div class="acessibilidade-opcoes"></div><button type="button" class="acessibilidade-restaurar">Restaurar padrões</button>';
    const grupo = painel.querySelector('.acessibilidade-opcoes');
    function atualizarBotoes() {
      grupo.querySelectorAll('button').forEach(item => {
        const ativo = preferencias[item.dataset.opcao] === true;
        item.setAttribute('aria-pressed', String(ativo));
        item.querySelector('span').textContent = ativo ? 'Ativado' : 'Desativado';
      });
    }
    for (const [nome, rotulo] of opcoes) {
      const item = document.createElement('button'); item.type = 'button'; item.dataset.opcao = nome;
      item.append(document.createTextNode(rotulo)); item.appendChild(document.createElement('span'));
      item.addEventListener('click', () => { preferencias[nome] = !preferencias[nome]; aplicar(); atualizarBotoes(); try { localStorage.setItem(chave, JSON.stringify(preferencias)); } catch {} });
      grupo.appendChild(item);
    }
    atualizarBotoes();
    function fechar() { painel.hidden = true; botao.setAttribute('aria-expanded', 'false'); botao.focus(); }
    botao.addEventListener('click', () => { if (!painel.hidden) { fechar(); return; } painel.hidden = false; botao.setAttribute('aria-expanded', 'true'); painel.querySelector('.acessibilidade-fechar').focus(); });
    painel.querySelector('.acessibilidade-fechar').addEventListener('click', fechar);
    painel.addEventListener('keydown', evento => { if (evento.key === 'Escape') { evento.preventDefault(); fechar(); } });
    painel.querySelector('.acessibilidade-restaurar').addEventListener('click', () => { preferencias = {}; aplicar(); atualizarBotoes(); try { localStorage.removeItem(chave); } catch {} });
    document.body.append(botao, painel);
  });
})();
