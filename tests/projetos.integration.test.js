import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { once } from 'node:events';

test('projetos, convites e permissões de equipe', { skip: process.env.RUN_DB_TESTS !== '1' }, async t => {
  process.env.PORT = '0';
  const { server } = await import('../server.js');
  const { prisma } = await import('../src/config/prisma.js');
  if (!server.listening) await once(server, 'listening');
  const base = 'http://127.0.0.1:' + server.address().port + '/api';
  const prefixo = 'projetos_qa_' + Date.now() + '_';
  const usuarios = [], cookies = [];
  async function req(caminho, method = 'GET', body, pessoa = 0) {
    return fetch(base + caminho, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookies[pessoa] ? { cookie: cookies[pessoa] } : {}) }, body: body ? JSON.stringify(body) : undefined });
  }
  async function json(caminho, method, body, pessoa) { const r = await req(caminho, method, body, pessoa); const d = await r.json(); assert.ok(r.ok, JSON.stringify(d)); return d; }
  let publico, privado, etapa;
  try {
    const senha = 'TesteSeguro123!', hash = await bcrypt.hash(senha, 4);
    for (let i = 0; i < 3; i++) {
      usuarios.push(await prisma.usuario.create({ data: { nome: 'Pessoa de projeto ' + i, usuario: prefixo + i, email: prefixo + i + '@example.com', senha: hash } }));
      const resposta = await req('/auth/login', 'POST', { identificador: prefixo + i, senha });
      assert.equal(resposta.status, 200); cookies.push(resposta.headers.get('set-cookie').split(';')[0]);
    }
    const [a, b, c] = usuarios.map(u => u.id);
    await t.test('criação valida campos e atribui o dono pela sessão', async () => {
      assert.equal((await req('/projetos', 'POST', { nome: 'a', descricao: 'curta' })).status, 400);
      assert.equal((await req('/projetos', 'POST', { nome: 'Projeto válido', descricao: 'Descrição válida de projeto', proprietarioId: b })).status, 400);
      publico = (await json('/projetos', 'POST', { nome: 'Projeto público QA', descricao: 'Projeto público para testes de equipe', tags: ['Web', 'Design'], publico: true })).projeto;
      privado = (await json('/projetos', 'POST', { nome: 'Projeto privado QA', descricao: 'Projeto privado para testes de equipe', tags: [], publico: false })).projeto;
      assert.equal(publico.proprietarioId, a); assert.equal(publico.souDono, true); assert.deepEqual(publico.tags, ['Web', 'Design']);
      assert.equal((await req('/projetos', 'POST', { nome: 'Projeto de tags', descricao: 'Descrição válida de teste', tags: ['React', 'réact'] })).status, 400);
    });
    await t.test('projetos públicos são visíveis; privados não vazam em busca ou perfil', async () => {
      assert.equal((await req('/projetos/' + publico.id, 'GET', undefined, 2)).status, 200);
      assert.equal((await req('/projetos/' + privado.id, 'GET', undefined, 2)).status, 404);
      const busca = await json('/projetos?aba=explorar', 'GET', undefined, 2); assert.ok(busca.projetos.some(p => p.id === publico.id)); assert.ok(!busca.projetos.some(p => p.id === privado.id));
      assert.deepEqual((await json('/projetos?aba=meus', 'GET', undefined, 1)).projetos, []);
      const perfil = await json('/usuarios/' + a, 'GET', undefined, 2); assert.ok(perfil.projetos.some(p => p.id === publico.id)); assert.ok(!perfil.projetos.some(p => p.id === privado.id));
      assert.equal((await req('/projetos/' + publico.id, 'PATCH', { nome: 'Invasão' }, 2)).status, 404);
    });
    await t.test('só o dono convida conexões aceitas e o convidado precisa aceitar', async () => {
      assert.equal((await req('/projetos/' + privado.id + '/convites', 'POST', { usuarioId: b })).status, 403);
      await prisma.conexao.create({ data: { solicitanteId: a, destinatarioId: b, parMenorId: Math.min(a, b), parMaiorId: Math.max(a, b), status: 'ACEITA' } });
      assert.equal((await req('/projetos/' + privado.id + '/convites', 'POST', { usuarioId: b }, 2)).status, 404);
      assert.equal((await req('/projetos/' + privado.id + '/convites', 'POST', { usuarioId: b })).status, 201);
      assert.equal((await req('/projetos/' + privado.id + '/convites', 'POST', { usuarioId: b })).status, 409);
      assert.equal((await req('/projetos/' + privado.id, 'GET', undefined, 1)).status, 404);
      assert.ok((await json('/projetos/convites', 'GET', undefined, 1)).convites.some(p => p.projetoId === privado.id));
      assert.equal((await req('/projetos/' + privado.id + '/convite', 'PATCH', { aceitar: true }, 2)).status, 404);
      await json('/projetos/' + privado.id + '/convite', 'PATCH', { aceitar: true }, 1);
      const projeto = (await json('/projetos/' + privado.id, 'GET', undefined, 1)).projeto; assert.equal(projeto.souMembro, true); assert.equal(projeto.souDono, false);
      assert.equal((await req('/projetos/' + privado.id, 'PATCH', { descricao: 'Integrante tentando editar' }, 1)).status, 404);
      const notificacoes = await json('/notificacoes', 'GET', undefined, 1); assert.equal(notificacoes.notificacoes.filter(n => n.projetoId === privado.id).length, 1);
    });
    await t.test('edição, tags e etapas só podem ser alteradas pelo proprietário', async () => {
      const atualizado = (await json('/projetos/' + privado.id, 'PATCH', { nome: 'Projeto editado', tags: ['Automação'], status: 'PAUSADO' })).projeto;
      assert.equal(atualizado.nome, 'Projeto editado'); assert.equal(atualizado.status, 'PAUSADO'); assert.deepEqual(atualizado.tags, ['Automação']);
      assert.equal((await req('/projetos/' + privado.id + '/etapas', 'POST', { titulo: 'Planejamento' }, 1)).status, 404);
      etapa = (await json('/projetos/' + privado.id + '/etapas', 'POST', { titulo: 'Planejamento' })).etapa;
      assert.equal((await req('/projetos/' + publico.id + '/etapas/' + etapa.id, 'PATCH', { concluida: true })).status, 404);
      assert.equal((await req('/projetos/' + privado.id + '/etapas/' + etapa.id, 'PATCH', { concluida: true }, 1)).status, 404);
      await json('/projetos/' + privado.id + '/etapas/' + etapa.id, 'PATCH', { concluida: true });
      assert.equal((await json('/projetos/' + privado.id)).projeto.etapas[0].concluida, true);
    });
    await t.test('painel e perfil contam apenas projetos reais e visíveis', async () => {
      assert.equal((await json('/painel')).projetos, 1);
      assert.equal((await json('/painel', 'GET', undefined, 1)).projetos, 0);
      assert.equal((await json('/usuarios/' + a)).estatisticas.projetos, 2);
      assert.equal((await json('/usuarios/' + a, 'GET', undefined, 2)).estatisticas.projetos, 1);
    });
    await t.test('remover integrante revoga acesso privado e o dono não pode sair', async () => {
      assert.equal((await req('/projetos/' + privado.id + '/participantes/' + b, 'DELETE', undefined, 2)).status, 404);
      assert.equal((await req('/projetos/' + privado.id + '/sair', 'POST')).status, 400);
      assert.equal((await req('/projetos/' + privado.id + '/participantes/' + b, 'DELETE')).status, 204);
      assert.equal((await req('/projetos/' + privado.id, 'GET', undefined, 1)).status, 404);
      await json('/projetos/' + privado.id + '/convites', 'POST', { usuarioId: b });
      await json('/projetos/' + privado.id + '/convite', 'PATCH', { aceitar: false }, 1);
      assert.equal((await json('/projetos/convites', 'GET', undefined, 1)).convites.length, 0);
      await json('/projetos/' + privado.id + '/convites', 'POST', { usuarioId: b });
      await json('/projetos/' + privado.id + '/convite', 'PATCH', { aceitar: true }, 1);
      assert.equal((await req('/projetos/' + privado.id + '/sair', 'POST', undefined, 1)).status, 204);
      assert.equal((await req('/projetos/' + privado.id, 'GET', undefined, 1)).status, 404);
    });
  } finally {
    await prisma.usuario.deleteMany({ where: { usuario: { startsWith: prefixo } } });
    await new Promise(resolve => server.close(resolve)); await prisma.$disconnect();
  }
});
