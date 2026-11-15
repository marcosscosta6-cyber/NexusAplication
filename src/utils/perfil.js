import { prisma } from '../config/prisma.js';
export const perfilSelect = {
 id:true,nome:true,usuario:true,curso:true,area:true,funcao:true,biografia:true,fotoPerfil:true,
 localizacao:true,nivel:true,disponibilidade:true,perfilPublico:true,
 habilidades:{select:{nome:true},orderBy:{nome:'asc'}},dataCadastro:true,
};
export const meuPerfilSelect = {...perfilSelect,email:true,dataNasc:true,escolaridade:true,mensagensPublicas:true,tema:true,fonteAmpliada:true};
export const par = (a,b) => ({parMenorId:Math.min(a,b),parMaiorId:Math.max(a,b)});
export const erroHttp = (mensagem,status=400) => Object.assign(new Error(mensagem),{status});
export function idValido(valor) {
 const numero=Number(valor);
 if (!Number.isInteger(numero) || numero<=0 || numero>2147483647) throw erroHttp('Identificador inválido.');
 return numero;
}
export const visivelPara = id => ({OR:[{id},{perfilPublico:true},{conexoesEnviadas:{some:{destinatarioId:id,status:'ACEITA'}}},{conexoesRecebidas:{some:{solicitanteId:id,status:'ACEITA'}}}]});
export async function podeEnviar(remetenteId,destinatarioId,db=prisma) {
 if(remetenteId===destinatarioId) return false;
 const destinatario=await db.usuario.findUnique({where:{id:destinatarioId},select:{mensagensPublicas:true}});
 if(!destinatario) return false;
 return destinatario.mensagensPublicas || !!(await db.conexao.findFirst({where:{...par(remetenteId,destinatarioId),status:'ACEITA'},select:{id:true}}));
}
