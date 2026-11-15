import test from 'node:test';
import assert from 'node:assert/strict';
import { api } from '../public/shared/ui.js';
test('cliente da API envia credenciais e mantém os avisos por campo',async()=>{
 const original=globalThis.fetch;
 try{
  globalThis.fetch=async(url,opcoes)=>{assert.equal(url,'/api/usuarios/me');assert.equal(opcoes.credentials,'include');assert.equal(opcoes.cache,'no-store');assert.equal(opcoes.headers['Content-Type'],'application/json');assert.equal(opcoes.body,JSON.stringify({nome:'Nome'}));return new Response(JSON.stringify({mensagem:'Confira os campos.',erros:[{campo:'nome',mensagem:'Nome inválido.'}]}),{status:400,headers:{'Content-Type':'application/json'}});};
  await assert.rejects(api('/usuarios/me',{method:'PATCH',body:{nome:'Nome'}}),erro=>erro.status===400&&erro.campos[0].campo==='nome');
 }finally{globalThis.fetch=original;}
});
test('falhas de rede e resposta inválida têm mensagens compreensíveis',async()=>{
 const original=globalThis.fetch;
 try{
  globalThis.fetch=async()=>{throw new TypeError('fetch failed');};
  await assert.rejects(api('/painel'),/Não foi possível conectar/);
  globalThis.fetch=async()=>new Response('<html>Erro</html>',{status:502,headers:{'Content-Type':'text/html'}});
  await assert.rejects(api('/painel'),/temporariamente indisponível/);
 }finally{globalThis.fetch=original;}
});
