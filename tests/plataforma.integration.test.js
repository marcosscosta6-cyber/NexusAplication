import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { once } from 'node:events';
import { unlink } from 'node:fs/promises';
const executar=process.env.RUN_DB_TESTS==='1';
test('dados pessoais, filtros, mensagens e privacidade', {skip:!executar}, async t=>{
 process.env.PORT='0';
 const {server}=await import('../server.js');
 const {prisma}=await import('../src/config/prisma.js');
 if(!server.listening)await once(server,'listening');
 const base='http://127.0.0.1:'+server.address().port+'/api';
 const prefixo='plataforma_'+Date.now()+'_';const senha='TesteSeguro123!';
 const usuarios=[],cookies=[];let foto;
 async function req(path,method='GET',body,cookie=cookies[0]){return fetch(base+path,{method,headers:{...(body&&!(body instanceof FormData)?{'Content-Type':'application/json'}:{}),...(cookie?{cookie}:{})},body:body instanceof FormData?body:body?JSON.stringify(body):undefined});}
 async function json(path,method='GET',body,cookie){const r=await req(path,method,body,cookie);const d=await r.json();assert.ok(r.ok,JSON.stringify(d));return d;}
 try{
  const hash=await bcrypt.hash(senha,4);
  for(let i=0;i<3;i++){
   usuarios.push(await prisma.usuario.create({data:{nome:'Pessoa QA '+i,usuario:prefixo+i,email:prefixo+i+'@example.com',senha:hash}}));
   const r=await req('/auth/login','POST',{identificador:prefixo+i,senha},null);assert.equal(r.status,200);cookies.push(r.headers.get('set-cookie').split(';')[0]);
  }
  const [a,b,c]=usuarios.map(u=>u.id);
  await t.test('nova conta começa sem dados herdados e o perfil não expõe segredos',async()=>{
   const me=await json('/usuarios/me');assert.equal(me.usuario.nome,'Pessoa QA 0');assert.deepEqual(me.usuario.habilidades,[]);assert.equal('senha' in me.usuario,false);assert.equal('comprovante' in me.usuario,false);
   const painel=await json('/painel');assert.equal(painel.conexoes,0);assert.equal(painel.mensagens,0);assert.equal(painel.solicitacoes,0);assert.deepEqual(painel.atividades,[]);
   const perfil=await json('/usuarios/'+b);assert.equal('email' in perfil.usuario,false);assert.equal('dataNasc' in perfil.usuario,false);
   assert.deepEqual((await json('/mensagens')).conversas,[]);
  });
  await t.test('edição persiste só no próprio perfil e todos os filtros são combináveis',async()=>{
   let d=await json('/usuarios/me','PATCH',{nome:'Pessoa QA Editada',curso:'desenvolvimento_de_sistemas',area:'tecnologia',funcao:'Desenvolvedor',localizacao:'BA',nivel:'Intermediário',disponibilidade:'Disponível',biografia:'Minha biografia',habilidades:['Node.js','SQL']},cookies[1]);
   assert.equal(d.usuario.habilidades.length,2);assert.equal(d.usuario.localizacao,'BA');
   assert.equal((await json('/usuarios/me')).usuario.nome,'Pessoa QA 0');
   const params=new URLSearchParams({q:'Pessoa QA Editada',area:'tecnologia',curso:'desenvolvimento_de_sistemas',nivel:'Intermediário',disponibilidade:'Disponível',habilidade:'SQL',funcao:'Desenvolvedor'});
   d=await json('/usuarios?'+params);assert.ok(d.usuarios.some(u=>u.id===b));assert.ok(d.usuarios.every(u=>u.id!==a));
   params.set('nivel','Avançado');d=await json('/usuarios?'+params);assert.equal(d.total,0);
   assert.equal((await req('/usuarios/me','PATCH',{id:b,nome:'Invasão'})).status,400);
   assert.equal((await req('/usuarios/me','PATCH',{habilidades:['SQL','sql']})).status,400);
  });
  await t.test('foto é validada e fica associada somente ao dono',async()=>{
   let form=new FormData();form.set('foto',new Blob(['svg'],{type:'image/svg+xml'}),'foto.svg');assert.equal((await req('/usuarios/me/foto','POST',form)).status,400);
   form=new FormData();form.set('foto',new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2ioAAAAASUVORK5CYII=','base64')],{type:'image/png'}),'foto.png');
   const d=await json('/usuarios/me/foto','POST',form);foto=d.fotoPerfil;assert.match(foto,/^\/media\/perfis\//);assert.equal((await json('/usuarios/me')).usuario.fotoPerfil,foto);assert.equal((await json('/usuarios/me','GET',undefined,cookies[1])).usuario.fotoPerfil,null);
  });
  await t.test('recebedor decide se aceita mensagens de pessoas sem conexão',async()=>{
   assert.equal((await req('/mensagens/'+b,'POST',{texto:'Não pode'})).status,403);
   await json('/configuracoes','PATCH',{mensagensPublicas:true},cookies[1]);
   const d=await json('/mensagens/'+b,'POST',{texto:'Olá de verdade'});assert.equal(d.mensagem.remetenteId,a);
   assert.equal((await req('/mensagens/'+a,'POST',{texto:'Ainda não pode responder'},cookies[1])).status,403);
   await json('/configuracoes','PATCH',{mensagensPublicas:true});
   await json('/mensagens/'+a,'POST',{texto:'Resposta'},cookies[1]);
   const conversa=await json('/mensagens/'+b);assert.deepEqual(conversa.mensagens.map(m=>m.texto),['Olá de verdade','Resposta']);
   const terceira=await json('/mensagens/'+a,'GET',undefined,cookies[2]);assert.deepEqual(terceira.mensagens,[]);
   const lista=await json('/mensagens');assert.equal(lista.conversas.length,1);assert.equal(lista.conversas[0].usuario.id,b);
   assert.deepEqual((await json('/mensagens','GET',undefined,cookies[2])).conversas,[]);
   await json('/configuracoes','PATCH',{mensagensPublicas:false},cookies[1]);
   assert.equal((await req('/mensagens/'+b,'POST',{texto:'Bloqueada'})).status,403);
   assert.equal((await json('/mensagens/'+b)).podeEnviar,false);
  });
  await t.test('conexão aceita permite mensagens e gera notificações uma única vez',async()=>{
   const convite=await json('/conexoes','POST',{destinatarioId:b});
   const recebidas=await json('/notificacoes','GET',undefined,cookies[1]);assert.ok(recebidas.notificacoes.some(n=>n.tipo==='SOLICITACAO'));
   await json('/conexoes/'+convite.conexao.id+'/responder','PATCH',{decisao:'ACEITA'},cookies[1]);
   await json('/mensagens/'+b,'POST',{texto:'Agora somos conexões'});
   const notificacoes=await json('/notificacoes');assert.equal(notificacoes.notificacoes.filter(n=>n.tipo==='CONEXAO_ACEITA').length,1);
   const outra=notificacoes.notificacoes[0];assert.equal((await req('/notificacoes/'+outra.id,'DELETE',undefined,cookies[2])).status,404);
   assert.equal((await req('/notificacoes/lidas','PATCH')).status,204);assert.equal((await json('/notificacoes')).naoLidas,0);
   assert.equal((await req('/notificacoes/'+outra.id,'DELETE')).status,204);
  });
  await t.test('perfil privado sai da busca para estranhos e visitas não contam o próprio dono',async()=>{
   await json('/configuracoes','PATCH',{perfilPublico:false},cookies[1]);
   assert.equal((await req('/usuarios/'+b,'GET',undefined,cookies[2])).status,404);
   assert.equal((await req('/conexoes','POST',{destinatarioId:b},cookies[2])).status,404);
   const encontrados=await json('/usuarios?q=Pessoa%20QA%20Editada','GET',undefined,cookies[2]);assert.equal(encontrados.usuarios.some(u=>u.id===b),false);
   assert.ok((await json('/usuarios/'+b)).usuario);
   assert.equal((await req('/usuarios/'+b+'/visita','POST')).status,204);assert.equal((await req('/usuarios/'+b+'/visita','POST')).status,204);
   assert.equal((await req('/usuarios/'+b+'/visita','POST',undefined,cookies[1])).status,204);
   assert.equal((await json('/usuarios/'+b)).estatisticas.visitas,1);
  });
  await t.test('paginação de mensagens e leitura não vazam conversas de terceiros',async()=>{
   await prisma.mensagem.createMany({data:Array.from({length:55},(_,i)=>({remetenteId:a,destinatarioId:b,texto:'Histórico '+i}))});
   const ultimas=await json('/mensagens/'+a,'GET',undefined,cookies[1]);assert.equal(ultimas.mensagens.length,50);assert.equal(ultimas.temMais,true);
   const antigas=await json('/mensagens/'+a+'?antes='+ultimas.mensagens[0].id,'GET',undefined,cookies[1]);assert.ok(antigas.mensagens.length>=5);assert.ok(antigas.mensagens.every(m=>m.id<ultimas.mensagens[0].id));
   assert.equal((await json('/painel','GET',undefined,cookies[1])).mensagens,0);
   const incremental=await json('/mensagens/'+a+'?depois='+ultimas.mensagens.at(-1).id,'GET',undefined,cookies[1]);assert.deepEqual(incremental.mensagens,[]);
  });
  await t.test('preferências e senha persistem na conta correta',async()=>{
   const d=await json('/configuracoes','PATCH',{tema:'claro',fonteAmpliada:true});assert.equal(d.usuario.tema,'claro');assert.equal((await json('/usuarios/me','GET',undefined,cookies[1])).usuario.tema,'escuro');
   assert.equal((await req('/configuracoes/senha','PATCH',{senhaAtual:'errada',novaSenha:'OutraSenha123',confirmacao:'OutraSenha123'})).status,400);
   await json('/configuracoes/senha','PATCH',{senhaAtual:senha,novaSenha:'OutraSenha123',confirmacao:'OutraSenha123'});
   assert.equal((await req('/auth/login','POST',{identificador:prefixo+0,senha},null)).status,401);
   assert.equal((await req('/auth/login','POST',{identificador:prefixo+0,senha:'OutraSenha123'},null)).status,200);
  });
 }finally{
  await prisma.usuario.deleteMany({where:{usuario:{startsWith:prefixo}}});
  if(foto&&/^\/media\/perfis\/[a-f0-9-]+\.png$/.test(foto))await unlink(new URL('../uploads/perfis/'+foto.split('/').pop(),import.meta.url)).catch(()=>{});
  await new Promise(resolve=>server.close(resolve));await prisma.$disconnect();
 }
});
