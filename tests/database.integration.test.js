import test from 'node:test';
import assert from 'node:assert/strict';
import { unlink } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { once } from 'node:events';

const executar = process.env.RUN_DB_TESTS === '1';
test('cadastro, autenticação e conexões no MySQL', { skip: !executar }, async t => {
  process.env.PORT = '0';
  const { server } = await import('../server.js');
  const { prisma } = await import('../src/config/prisma.js');
  if (!server.listening) await once(server, 'listening');
  const base = 'http://127.0.0.1:' + server.address().port + '/api';
  const prefixo = 'teste_' + Date.now() + '_';
  const ids = [];
  const cookies = [];
  const senha = 'TesteSeguro123!';
  async function request(path, method = 'GET', body, cookie) {
    return fetch(base + path, { method, headers: { ...(body && !(body instanceof FormData) ? {'Content-Type':'application/json'} : {}), ...(cookie ? {cookie} : {}) }, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined });
  }
  function cadastro(indice) {
    const form = new FormData();
    for (const [key,value] of Object.entries({nome:'Usuário de teste ' + indice,email:prefixo+indice+'@example.com',usuario:prefixo+indice,senha,confirm:senha,dataNasc:'2000-01-01',escolaridade:'tecAn'})) form.set(key,value);
    form.set('Comprovante',new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2ioAAAAASUVORK5CYII=','base64')],{type:'image/png'}),'comprovante.png');
    return form;
  }
  try {
    await t.test('cadastro exige aprovação antes do login', async () => {
      for (let i=0;i<3;i++) {
        const resposta = await request('/usuarios','POST',cadastro(i));
        assert.equal(resposta.status,201);
        const dados = await resposta.json(); ids.push(dados.usuario.id);
        assert.equal('senha' in dados.usuario,false);
        const salvo = await prisma.usuario.findUnique({where:{id:ids[i]}});
        assert.notEqual(salvo.senha,senha);
        assert.equal(salvo.situacao,'PENDENTE');
        assert.equal((await request('/auth/login','POST',{identificador:prefixo+i,senha})).status,403);
        await prisma.usuario.update({where:{id:ids[i]},data:{situacao:'APROVADO'}});
        const login = await request('/auth/login','POST',{identificador:prefixo+i,senha});
        assert.equal(login.status,200);
        cookies.push(login.headers.get('set-cookie').split(';')[0]);
        assert.equal((await request('/usuarios/me','GET',null,cookies[i])).status,200);
      }
    });
    await t.test('duplicidade retorna 409 e senha incorreta retorna 401', async () => {
      assert.equal((await request('/usuarios','POST',cadastro(0))).status,409);
      assert.equal((await request('/auth/login','POST',{identificador:prefixo+0,senha:'SenhaErrada'})).status,401);
      assert.equal((await request('/conexoes')).status,401);
    });
    await t.test('cadastros simultâneos respeitam a unicidade', async () => {
      const respostas = await Promise.all([request('/usuarios','POST',cadastro(3)),request('/usuarios','POST',cadastro(3))]);
      assert.deepEqual(respostas.map(r=>r.status).sort(),[201,409]);
    });
    await t.test('avisos do cadastro indicam os campos e o limite do comprovante', async () => {
      let form=cadastro(4); form.set('usuario','nome inválido');
      let resposta=await request('/usuarios','POST',form);
      assert.equal(resposta.status,400);
      assert.ok((await resposta.json()).erros.some(e=>e.campo==='usuario'));
      form=cadastro(4); form.delete('Comprovante');
      resposta=await request('/usuarios','POST',form);
      assert.equal(resposta.status,400);
      assert.equal((await resposta.json()).erros[0].campo,'Comprovante');
      form=cadastro(4); form.set('Comprovante',new Blob(['teste'],{type:'text/plain'}),'comprovante.txt');
      resposta=await request('/usuarios','POST',form);
      assert.equal(resposta.status,400);
      assert.equal((await resposta.json()).erros[0].campo,'Comprovante');
      form=cadastro(4); form.set('Comprovante',new Blob([new Uint8Array(5*1024*1024+1)],{type:'image/png'}),'comprovante.png');
      resposta=await request('/usuarios','POST',form);
      assert.equal(resposta.status,400);
      assert.match((await resposta.json()).erros[0].mensagem,/5 MB/);
      resposta=await request('/usuarios','POST',cadastro(0));
      assert.equal(resposta.status,409);
      assert.equal((await resposta.json()).erros[0].campo,'usuario');
    });
    let id;
    await t.test('solicitações simultâneas em sentidos opostos criam um único par', async () => {
      const respostas = await Promise.all([request('/conexoes','POST',{destinatarioId:ids[1]},cookies[0]),request('/conexoes','POST',{destinatarioId:ids[0]},cookies[1])]);
      assert.deepEqual(respostas.map(r=>r.status).sort(),[201,409]);
      const registros = await prisma.conexao.findMany({where:{parMenorId:Math.min(ids[0],ids[1]),parMaiorId:Math.max(ids[0],ids[1])}});
      assert.equal(registros.length,1); id=registros[0].id;
    });
    await t.test('permissão e resposta atômica da solicitação', async () => {
      const conexao = await prisma.conexao.findUnique({where:{id}});
      const destino = ids.indexOf(conexao.destinatarioId);
      assert.equal((await request('/conexoes/'+id+'/responder','PATCH',{decisao:'ACEITA'},cookies[2])).status,404);
      const respostas = await Promise.all([request('/conexoes/'+id+'/responder','PATCH',{decisao:'ACEITA'},cookies[destino]),request('/conexoes/'+id+'/responder','PATCH',{decisao:'ACEITA'},cookies[destino])]);
      assert.equal(respostas.filter(r=>r.status===200).length,1);
      assert.ok(respostas.some(r=>[404,409].includes(r.status)));
      const lista = await (await request('/conexoes','GET',null,cookies[0])).json();
      assert.ok(lista.conexoes.some(c=>c.id===id));
      assert.equal((await request('/conexoes/'+id,'DELETE',null,cookies[2])).status,404);
      assert.equal((await request('/conexoes/'+id,'DELETE',null,cookies[0])).status,204);
    });
    await t.test('cancelamento, recusa e validação de IDs', async () => {
      let resposta = await request('/conexoes','POST',{destinatarioId:ids[1]},cookies[0]);
      id=(await resposta.json()).conexao.id;
      assert.equal((await request('/conexoes/'+id,'DELETE',null,cookies[1])).status,404);
      assert.equal((await request('/conexoes/'+id,'DELETE',null,cookies[0])).status,204);
      resposta=await request('/conexoes','POST',{destinatarioId:ids[1]},cookies[0]);
      id=(await resposta.json()).conexao.id;
      assert.equal((await request('/conexoes/'+id+'/responder','PATCH',{decisao:'RECUSADA'},cookies[1])).status,200);
      const recebidas=await (await request('/conexoes/recebidas','GET',null,cookies[1])).json();
      assert.equal(recebidas.solicitacoes.length,0);
      // O destinatário anterior pode iniciar o novo convite, invertendo a direção.
      const novos = await Promise.all([request('/conexoes','POST',{destinatarioId:ids[0]},cookies[1]),request('/conexoes','POST',{destinatarioId:ids[0]},cookies[1])]);
      assert.deepEqual(novos.map(r=>r.status).sort(),[201,409]);
      const reaberta = await prisma.conexao.findUnique({where:{id}});
      assert.equal(reaberta.status,'PENDENTE');
      assert.equal(reaberta.solicitanteId,ids[1]);
      assert.equal(reaberta.destinatarioId,ids[0]);
      assert.equal((await request('/conexoes','POST',{destinatarioId:ids[0]},cookies[0])).status,400);
      assert.equal((await request('/conexoes','POST',{destinatarioId:2147483648},cookies[0])).status,400);
      const logout=await request('/auth/logout','POST',null,cookies[0]);
      assert.equal(logout.status,200);
      assert.ok(logout.headers.get('set-cookie').includes('Expires=Thu, 01 Jan 1970'));
    });
  } finally {
    // Remove somente os usuários criados por esta execução; conexões usam cascade.
    const usuarios = await prisma.usuario.findMany({where:{usuario:{startsWith:prefixo}},select:{id:true,comprovante:true}});
    await prisma.usuario.deleteMany({where:{id:{in:usuarios.map(u=>u.id)}}});
    const raiz=resolve('uploads','comprovantes')+sep;
    for (const u of usuarios) {
      const arquivo=resolve(u.comprovante || '');
      if (arquivo.startsWith(raiz)) await unlink(arquivo).catch(()=>{});
    }
    await new Promise(resolve=>server.close(resolve));
    await prisma.$disconnect();
  }
});
