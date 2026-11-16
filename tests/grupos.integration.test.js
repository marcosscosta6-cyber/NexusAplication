import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { once } from 'node:events';

test('grupos de equipe: criação, histórico e controle de acesso', { skip: process.env.RUN_DB_TESTS !== '1' }, async t => {
  process.env.PORT = '0';
  const { server } = await import('../server.js');
  const { prisma } = await import('../src/config/prisma.js');
  if (!server.listening) await once(server, 'listening');
  const base = 'http://127.0.0.1:' + server.address().port + '/api';
  const prefixo = 'grupos_qa_' + Date.now() + '_';
  const usuarios = [];
  async function req(path, method = 'GET', body, i = 0) {
    return fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(i >= 0 ? { cookie: 'nexusToken=' + jwt.sign({}, process.env.JWT_SECRET, { subject: String(usuarios[i].id), expiresIn: '5m' }) } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  }
  async function json(path, method, body, i) { const r = await req(path, method, body, i); const d = await r.json(); assert.ok(r.ok, JSON.stringify(d)); return d; }
  try {
    for (let i = 0; i < 4; i++) usuarios.push(await prisma.usuario.create({ data: { nome: 'Pessoa teste grupo ' + i, usuario: prefixo + i, email: prefixo + i + '@example.com', senha: 'conta-sem-login-por-senha' } }));
    const projeto = await prisma.projeto.create({ data: { proprietarioId: usuarios[0].id, nome: 'Projeto de grupo QA', descricao: 'Equipe para testar o chat', tags: [], publico: true, participantes: { create: [{ usuarioId: usuarios[1].id, aceita: true }, { usuarioId: usuarios[2].id, aceita: false }] } } });
    let grupo;
    await t.test('apenas dono cria; repetir criação retorna o mesmo grupo', async () => {
      assert.equal((await req('/grupos', 'POST', { projetoId: projeto.id }, -1)).status, 401);
      assert.equal((await req('/grupos', 'POST', { projetoId: projeto.id }, 1)).status, 403);
      assert.equal((await req('/grupos', 'POST', { projetoId: projeto.id, nome: 'a' })).status, 400);
      grupo = (await json('/grupos', 'POST', { projetoId: projeto.id, nome: 'Equipe QA' })).grupo;
      assert.equal((await json('/grupos', 'POST', { projetoId: projeto.id })).grupo.id, grupo.id);
    });
    await t.test('público não libera chat para visitante ou convite pendente', async () => {
      for (const i of [2, 3]) {
        assert.equal((await req('/grupos/' + grupo.id, 'GET', undefined, i)).status, 404);
        assert.equal((await req('/grupos/' + grupo.id + '/mensagens', 'POST', { texto: 'Sem permissão' }, i)).status, 404);
        assert.ok(!(await json('/grupos', 'GET', undefined, i)).grupos.some(g => g.id === grupo.id));
      }
      const g = await json('/grupos/' + grupo.id, 'GET', undefined, 1);
      assert.equal(g.grupo.integrantes.length, 2);
    });
    await t.test('membro envia sem conexão individual; remetente é definido pela sessão', async () => {
      assert.equal((await req('/grupos/' + grupo.id + '/mensagens', 'POST', { texto: '   ' }, 1)).status, 400);
      assert.equal((await req('/grupos/' + grupo.id + '/mensagens', 'POST', { texto: 'x'.repeat(2001) }, 1)).status, 400);
      assert.equal((await req('/grupos/' + grupo.id + '/mensagens', 'POST', { texto: 'Olá', remetenteId: usuarios[0].id }, 1)).status, 400);
      const { mensagem } = await json('/grupos/' + grupo.id + '/mensagens', 'POST', { texto: 'Olá, equipe!' }, 1);
      assert.equal(mensagem.remetenteId, usuarios[1].id);
      assert.equal(mensagem.remetente.senha, undefined);
      await prisma.mensagemGrupo.createMany({ data: Array.from({ length: 54 }, (_, i) => ({ grupoId: grupo.id, remetenteId: usuarios[0].id, texto: 'Mensagem ' + i })) });
      const recente = await json('/grupos/' + grupo.id);
      assert.equal(recente.mensagens.length, 50); assert.equal(recente.temMais, true);
      const antigas = await json('/grupos/' + grupo.id + '?antes=' + recente.mensagens[0].id);
      assert.equal(antigas.mensagens.length, 5); assert.equal(antigas.temMais, false);
      assert.ok(antigas.mensagens.at(-1).id < recente.mensagens[0].id);
      const novas = await json('/grupos/' + grupo.id + '?depois=' + recente.mensagens.at(-1).id);
      assert.equal(novas.mensagens.length, 0);
    });
    await t.test('aceitar convite libera; sair revoga leitura e envio', async () => {
      await prisma.participacaoProjeto.update({ where: { projetoId_usuarioId: { projetoId: projeto.id, usuarioId: usuarios[2].id } }, data: { aceita: true } });
      assert.equal((await req('/grupos/' + grupo.id, 'GET', undefined, 2)).status, 200);
      await prisma.participacaoProjeto.delete({ where: { projetoId_usuarioId: { projetoId: projeto.id, usuarioId: usuarios[1].id } } });
      assert.equal((await req('/grupos/' + grupo.id, 'GET', undefined, 1)).status, 404);
      assert.equal((await req('/grupos/' + grupo.id + '/mensagens', 'POST', { texto: 'Não deve enviar' }, 1)).status, 404);
    });
    await t.test('exclusão do projeto remove grupo e mensagens por chave estrangeira', async () => {
      await prisma.projeto.delete({ where: { id: projeto.id } });
      assert.equal(await prisma.grupoChat.count({ where: { id: grupo.id } }), 0);
      assert.equal(await prisma.mensagemGrupo.count({ where: { grupoId: grupo.id } }), 0);
    });
  } finally {
    await prisma.usuario.deleteMany({ where: { usuario: { startsWith: prefixo } } });
    await new Promise(resolve => server.close(resolve)); await prisma.$disconnect();
  }
});
