import test from 'node:test';
import assert from 'node:assert/strict';
import { instalarBusca } from '../public/shared/busca.js';

test('busca contextual mantém aba e filtros e reinicia a paginação', () => {
  const anterior = { document: globalThis.document, location: globalThis.location };
  try {
    for (const pagina of ['projetos', 'explorar', 'notificacoes']) {
      const eventos = {}, input = { value: '', setAttribute() {}, closest() { return null; }, addEventListener(tipo, fn) { eventos[tipo] = fn; } };
      let destino;
      globalThis.document = { body: { dataset: { pagina } }, querySelector() { return input; } };
      globalThis.location = { href: 'http://localhost/tela.html?aba=meus&area=tecnologia&pagina=4&q=anterior', assign(url) { destino = url; } };
      instalarBusca(); assert.equal(input.value, 'anterior');
      input.value = 'projeto & equipe'; eventos.keydown({ key: 'Enter', preventDefault() {} });
      const url = new URL(destino, 'http://localhost');
      assert.equal(url.searchParams.get('aba'), 'meus'); assert.equal(url.searchParams.get('area'), 'tecnologia');
      assert.equal(url.searchParams.has('pagina'), false); assert.equal(url.searchParams.get('q'), input.value);
      input.value = ''; eventos.search();
      assert.equal(new URL(destino, 'http://localhost').searchParams.has('q'), false);
    }
  } finally {
    if (anterior.document === undefined) delete globalThis.document; else globalThis.document = anterior.document;
    if (anterior.location === undefined) delete globalThis.location; else globalThis.location = anterior.location;
  }
});
