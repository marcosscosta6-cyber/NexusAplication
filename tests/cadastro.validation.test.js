import test from 'node:test';
import assert from 'node:assert/strict';
import { cadastroUsuarioSchema } from '../src/schemas/usuarioSchema.js';
const valido = {nome:'Nome de Teste',email:'nome@example.com',usuario:'nome_teste',senha:'Senha1234',confirm:'Senha1234',dataNasc:'2000-01-01',escolaridade:'tecAn'};
test('cadastro válido converte a data sem mudar o dia', () => {
  assert.equal(cadastroUsuarioSchema.parse(valido).dataNasc.toISOString(),'2000-01-01T00:00:00.000Z');
});
test('erros do formulário são associados ao campo correto', () => {
  const resultado=cadastroUsuarioSchema.safeParse({...valido,nome:'a',email:'email',usuario:'com espaço',senha:'curta',confirm:'outra',escolaridade:''});
  assert.equal(resultado.success,false);
  const campos=resultado.error.issues.map(e=>e.path[0]);
  for(const campo of ['nome','email','usuario','senha','escolaridade']) assert.ok(campos.includes(campo));
  const senhas=cadastroUsuarioSchema.safeParse({...valido,confirm:'OutraSenha'});
  assert.ok(senhas.error.issues.some(e=>e.path[0]==='confirm'));
});
test('datas vazias, inexistentes e futuras são rejeitadas', () => {
  for (const dataNasc of ['','2025-02-30','2001-02-29','9999-01-01','0000-01-01']) assert.equal(cadastroUsuarioSchema.safeParse({...valido,dataNasc}).success,false,dataNasc);
});
test('limite da senha considera bytes UTF-8 e aceita 72 bytes', () => {
  for (const senha of ['a'.repeat(72),'á'.repeat(36)]) assert.equal(cadastroUsuarioSchema.safeParse({...valido,senha,confirm:senha}).success,true);
  for (const senha of ['a'.repeat(73),'á'.repeat(37)]) assert.equal(cadastroUsuarioSchema.safeParse({...valido,senha,confirm:senha}).success,false);
});
