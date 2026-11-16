const normalizar = valor => String(valor || '').normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('pt-BR');

export function instalarBusca() {
  const input = document.querySelector('.search-box input');
  if (!input) return;
  const pagina = document.body.dataset.pagina;
  const remotas = { explorar: 'pessoas', projetos: 'projetos desta aba', notificacoes: 'notificações' };
  const locais = {
    conexoes: ['.conexao-card', 'conexões desta aba'],
    config: ['.config-item', 'configurações'],
    perfil: ['.secao', 'neste perfil'], perfilUser: ['.secao', 'neste perfil'],
    detalhe: ['.member,.milestone,.tag', 'equipe, etapas e tags'],
    admin: ['.admin-card', 'cadastros'],
  };
  input.type = 'search'; input.maxLength = 120;
  input.placeholder = 'Buscar ' + (remotas[pagina] || locais[pagina]?.[1] || 'pessoas no Nexus') + '...';
  input.setAttribute('aria-label', input.placeholder.replace('...', ''));
  const url = new URL(location.href);
  if (remotas[pagina]) input.value = url.searchParams.get('q') || '';
  function buscarRemoto() {
    if (pagina === 'admin') {
      const filtros = document.getElementById('filtros-admin');
      if (filtros) { filtros.elements.q.value = input.value; filtros.requestSubmit(); }
      return;
    }
    if (remotas[pagina]) {
      const destino = new URL(location.href); destino.searchParams.delete('pagina');
      if (input.value.trim()) destino.searchParams.set('q', input.value.trim()); else destino.searchParams.delete('q');
      location.assign(destino.pathname + destino.search); return;
    }
    if (!locais[pagina]) location.href = '/FrontEnd Interno/explorar/explorar.html?q=' + encodeURIComponent(input.value.trim());
  }
  input.addEventListener('keydown', evento => { if (evento.key === 'Enter') { evento.preventDefault(); buscarRemoto(); } });
  const lupa = input.closest('.search-box')?.querySelector('i');
  if (lupa) {
    lupa.setAttribute('role', 'button'); lupa.setAttribute('aria-label', 'Pesquisar'); lupa.tabIndex = 0;
    lupa.addEventListener('click', () => { input.dispatchEvent(new Event('input')); buscarRemoto(); });
    lupa.addEventListener('keydown', evento => { if (evento.key === 'Enter' || evento.key === ' ') { evento.preventDefault(); input.dispatchEvent(new Event('input')); buscarRemoto(); } });
  }
  if (!locais[pagina] || pagina === 'admin') {
    input.addEventListener('search', () => { if (!input.value) buscarRemoto(); }); return;
  }
  const [seletor] = locais[pagina];
  const main = document.querySelector('main'); if (!main) return;
  const retorno = document.createElement('p'); retorno.className = 'busca-retorno'; retorno.setAttribute('role', 'status'); retorno.hidden = true;
  main.prepend(retorno);
  function filtrar() {
    const termo = normalizar(input.value.trim());
    const itens = [...main.querySelectorAll(seletor)]; let encontrados = 0;
    for (const item of itens) { const corresponde = !termo || normalizar(item.textContent).includes(termo); item.hidden = !corresponde; if (corresponde) encontrados++; }
    retorno.hidden = !termo;
    const texto = encontrados ? encontrados + ' resultado(s) para “' + input.value.trim() + '”.' : 'Nenhum resultado para “' + input.value.trim() + '”. Limpe a busca para ver tudo.';
    if (retorno.textContent !== texto) retorno.textContent = texto;
  }
  input.addEventListener('input', filtrar);
  new MutationObserver(filtrar).observe(main, { childList: true, subtree: true });
  filtrar();
}
