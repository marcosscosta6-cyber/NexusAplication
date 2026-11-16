import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';

test('administração de comprovantes e aprovação obrigatória', { skip: process.env.RUN_DB_TESTS !== '1' }, async t => {
  process.env.PORT = '0';
  const { server } = await import('../server.js');
  const { prisma } = await import('../src/config/prisma.js');
  if (!server.listening) await once(server, 'listening');
  const base = 'http://127.0.0.1:' + server.address().port + '/api';
  const prefixo = 'admin_qa_' + Date.now() + '_', senha = 'AdminTeste123!';
  const arquivo = randomUUID() + '.pdf', pasta = new URL('../uploads/comprovantes/', import.meta.url);
  const usuarios = [];
  async function req(path, method = 'GET', body, i = 0) {
    return fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(i >= 0 ? { cookie: 'nexusToken=' + jwt.sign({}, process.env.JWT_SECRET, { subject: String(usuarios[i].id), expiresIn: '5m' }) } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  }
  async function json(path, method, body, i) { const r = await req(path, method, body, i); const d = await r.json(); assert.ok(r.ok, JSON.stringify(d)); return d; }
  try {
    await mkdir(pasta, { recursive: true }); await writeFile(new URL(arquivo, pasta), '%PDF-1.4\n%%EOF');
    const hash = await bcrypt.hash(senha, 4);
    for (let i = 0; i < 4; i++) usuarios.push(await prisma.usuario.create({ data: { nome: 'Pessoa teste admin ' + i, usuario: prefixo + i, email: prefixo + i + '@example.com', senha: hash, admin: i === 0, situacao: i < 2 ? 'APROVADO' : 'PENDENTE', comprovante: i === 2 ? 'uploads/comprovantes/' + arquivo : null } }));
    await t.test('rotas e documentos exigem sessão administrativa', async () => {
      for (const path of ['/admin/cadastros', '/admin/cadastros/' + usuarios[2].id, '/admin/cadastros/' + usuarios[2].id + '/comprovante']) {
        assert.equal((await req(path, 'GET', undefined, -1)).status, 401);
        assert.equal((await req(path, 'GET', undefined, 1)).status, 403);
      }
      assert.equal((await req('/admin/administradores', 'POST', { nome: 'Intruso' }, 1)).status, 403);
      assert.equal((await req('/usuarios/me', 'GET', undefined, 2)).status, 403);
      const login = await req('/auth/login', 'POST', { identificador: usuarios[2].usuario, senha }, -1);
      assert.equal(login.status, 403); assert.match((await login.json()).mensagem, /aguarda aprovação/);
    });
    await t.test('busca não revela senha nem caminho de arquivo; documento é servido em rota privada', async () => {
      const lista = await json('/admin/cadastros?q=' + prefixo + '&situacao=PENDENTE');
      assert.equal(lista.total, 2);
      assert.ok(lista.usuarios.every(u => u.senha === undefined && u.comprovante === undefined));
      const doc = await req('/admin/cadastros/' + usuarios[2].id + '/comprovante');
      assert.equal(doc.status, 200); assert.match(doc.headers.get('content-type'), /application\/pdf/);
      assert.equal(doc.headers.get('x-content-type-options'), 'nosniff');
      assert.equal((await req('/admin/cadastros/' + usuarios[3].id + '/comprovante')).status, 404);
      assert.equal((await fetch(base.replace('/api', '') + '/uploads/comprovantes/' + arquivo)).status, 404);
    });
    await t.test('aprovar libera login e recusar exige motivo, registra histórico e revoga sessão', async () => {
      const path = '/admin/cadastros/' + usuarios[2].id;
      assert.equal((await req('/admin/cadastros/' + usuarios[3].id, 'PATCH', { situacao: 'APROVADO' })).status, 400);
      await json(path, 'PATCH', { situacao: 'APROVADO' });
      assert.equal((await req('/auth/login', 'POST', { identificador: usuarios[2].usuario, senha }, -1)).status, 200);
      assert.equal((await req('/usuarios/me', 'GET', undefined, 2)).status, 200);
      assert.equal((await req(path, 'PATCH', { situacao: 'APROVADO' })).status, 409);
      assert.equal((await req(path, 'PATCH', { situacao: 'RECUSADO', motivo: '' })).status, 400);
      await json(path, 'PATCH', { situacao: 'RECUSADO', motivo: 'Documento ilegível no teste.' });
      assert.equal((await req('/usuarios/me', 'GET', undefined, 2)).status, 403);
      const login = await req('/auth/login', 'POST', { identificador: usuarios[2].usuario, senha }, -1);
      assert.equal(login.status, 403); assert.match((await login.json()).mensagem, /recusado/);
      const { usuario } = await json(path);
      assert.equal(usuario.analisesRecebidas.length, 2);
      assert.equal(usuario.analisesRecebidas[0].administrador.nome, usuarios[0].nome);
      assert.equal(usuario.analisesRecebidas[0].motivo, 'Documento ilegível no teste.');
      assert.equal((await req('/admin/cadastros/' + usuarios[0].id, 'PATCH', { situacao: 'RECUSADO', motivo: 'Não pode analisar admin' })).status, 404);
    });
    await t.test('novo administrador só nasce por rota restrita e com senha protegida', async () => {
      const dados = { nome: 'Novo administrador QA', usuario: prefixo + 'novo', email: prefixo + 'novo@example.com', senha };
      const novo = (await json('/admin/administradores', 'POST', dados)).usuario;
      const salvo = await prisma.usuario.findUnique({ where: { id: novo.id } });
      assert.equal(salvo.admin, true); assert.equal(salvo.situacao, 'APROVADO');
      assert.notEqual(salvo.senha, senha); assert.equal(novo.senha, undefined);
      assert.equal((await req('/auth/login', 'POST', { identificador: dados.usuario, senha }, -1)).status, 200);
      assert.equal((await req('/admin/administradores', 'POST', dados)).status, 409);
    });
  } finally {
    const ids = (await prisma.usuario.findMany({ where: { usuario: { startsWith: prefixo } }, select: { id: true } })).map(u => u.id);
    await prisma.analiseCadastro.deleteMany({ where: { OR: [{ usuarioId: { in: ids } }, { adminId: { in: ids } }] } });
    await prisma.usuario.deleteMany({ where: { id: { in: ids } } });
    await unlink(new URL(arquivo, pasta)).catch(() => {});
    await new Promise(resolve => server.close(resolve)); await prisma.$disconnect();
  }
});
