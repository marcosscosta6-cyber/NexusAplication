import { equipeDe, projetosVisiveis } from './projetoRoutes.js';
import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { prisma } from '../config/prisma.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { perfilSelect, meuPerfilSelect, par, erroHttp, idValido, visivelPara, podeEnviar } from '../utils/perfil.js';
import { cursos, areas, estados, niveis, disponibilidades } from '../../public/shared/catalogo.js';
const router=Router();
router.use(authMiddleware);
const rota=fn=>async(req,res,next)=>{try{await fn(req,res);}catch(erro){if(erro instanceof z.ZodError)return res.status(400).json({mensagem:'Confira os campos informados.',erros:erro.issues.map(e=>({campo:e.path.join('.'),mensagem:e.message}))});next(erro);}};
const paginaSchema=z.object({pagina:z.coerce.number().int().min(1).max(10000).default(1)});
const opcional=valores=>z.union([z.literal(''),z.enum(valores)]).transform(v=>v||null).optional();
const texto=limite=>z.string().trim().max(limite).transform(v=>v||null).optional();
const perfilSchema=z.object({
 nome:z.string().trim().min(3).max(120).optional(),
 curso:opcional(Object.keys(cursos)),area:opcional(Object.keys(areas)),localizacao:opcional(Object.keys(estados)),
 funcao:texto(100),biografia:texto(2000),nivel:opcional(niveis),disponibilidade:opcional(disponibilidades),
 habilidades:z.array(z.string().trim().min(1).max(30)).max(30).refine(lista=>new Set(lista.map(s=>s.normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase('pt-BR'))).size===lista.length,'Não repita habilidades.').optional(),
}).strict();
router.get('/usuarios/me',rota(async(req,res)=>{
 const usuario=await prisma.usuario.findUnique({where:{id:req.usuario.id},select:meuPerfilSelect});
 res.json({usuario});
}));
router.patch('/usuarios/me',rota(async(req,res)=>{
 const {habilidades,...dados}=perfilSchema.parse(req.body);
 const usuario=await prisma.usuario.update({where:{id:req.usuario.id},data:{...dados,...(habilidades?{habilidades:{deleteMany:{},create:habilidades.map(nome=>({nome}))}}:{})},select:meuPerfilSelect});
 res.json({usuario,mensagem:'Perfil atualizado.'});
}));
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:2*1024*1024,files:1}});
router.post('/usuarios/me/foto',(req,res,next)=>upload.single('foto')(req,res,erro=>{
 if(erro) return res.status(400).json({mensagem:'Envie uma única imagem PNG ou JPG de até 2 MB.'});next();
}),rota(async(req,res)=>{
 const arquivo=req.file;
 if(!arquivo) throw erroHttp('Selecione uma imagem.');
 const png=arquivo.mimetype==='image/png' && arquivo.buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 const jpg=arquivo.mimetype==='image/jpeg' && arquivo.buffer[0]===255 && arquivo.buffer[1]===216 && arquivo.buffer[2]===255;
 if(!png&&!jpg) throw erroHttp('Envie uma imagem PNG ou JPG válida.');
 const pasta=new URL('../../uploads/perfis/',import.meta.url);
 await mkdir(pasta,{recursive:true});
 const nome=randomUUID()+(png?'.png':'.jpg');
 const destino=new URL(nome,pasta);
 const anterior=await prisma.usuario.findUnique({where:{id:req.usuario.id},select:{fotoPerfil:true}});
 try {
  await writeFile(destino,arquivo.buffer);
  await prisma.usuario.update({where:{id:req.usuario.id},data:{fotoPerfil:'/media/perfis/'+nome}});
 }catch(erro){await unlink(destino).catch(()=>{});throw erro;}
 if(/^\/media\/perfis\/[0-9a-f-]+\.(png|jpg)$/.test(anterior.fotoPerfil||'')) await unlink(new URL(anterior.fotoPerfil.split('/').pop(),pasta)).catch(()=>{});
 res.json({fotoPerfil:'/media/perfis/'+nome,mensagem:'Foto atualizada.'});
}));
router.get('/usuarios',rota(async(req,res)=>{
 const filtros=z.object({pagina:z.coerce.number().int().min(1).max(10000).default(1),q:z.string().trim().max(120).default(''),habilidade:z.string().trim().max(30).default(''),funcao:z.string().trim().max(100).default(''),area:opcional(Object.keys(areas)),curso:opcional(Object.keys(cursos)),nivel:opcional(niveis),disponibilidade:opcional(disponibilidades)}).strict().parse(req.query);
 const {pagina,q,habilidade,funcao,...campos}=filtros;
 const where={AND:[{id:{not:req.usuario.id}},visivelPara(req.usuario.id),...Object.entries(campos).filter(([,v])=>v).map(([k,v])=>({[k]:v})),...(q?[{OR:[{nome:{contains:q}},{usuario:{contains:q}},{funcao:{contains:q}}]}]:[]),...(funcao?[{funcao:{contains:funcao}}]:[]),...(habilidade?[{habilidades:{some:{nome:{contains:habilidade}}}}]:[])]};
 const [usuarios,total]=await prisma.$transaction([prisma.usuario.findMany({where,select:perfilSelect,orderBy:[{nome:'asc'},{id:'asc'}],skip:(pagina-1)*12,take:12}),prisma.usuario.count({where})]);
 const conexoes=await prisma.conexao.findMany({where:{OR:[{solicitanteId:req.usuario.id,destinatarioId:{in:usuarios.map(u=>u.id)}},{destinatarioId:req.usuario.id,solicitanteId:{in:usuarios.map(u=>u.id)}}]}});
 res.json({usuarios:usuarios.map(u=>({...u,conexao:conexoes.find(c=>c.solicitanteId===u.id||c.destinatarioId===u.id)||null})),total,pagina,paginas:Math.ceil(total/12)});
}));
router.get('/usuarios/:id',rota(async(req,res)=>{
 const id=idValido(req.params.id);
 const usuario=await prisma.usuario.findFirst({where:{AND:[{id},visivelPara(req.usuario.id)]},select:perfilSelect});
 if(!usuario) throw erroHttp('Perfil não encontrado ou restrito a conexões.',404);
 const [conexao,totalConexoes,totalVisitas]=await Promise.all([prisma.conexao.findFirst({where:par(id,req.usuario.id)}),prisma.conexao.count({where:{status:'ACEITA',OR:[{solicitanteId:id},{destinatarioId:id}]}}),prisma.visitaPerfil.count({where:{usuarioId:id}})]);
 const projetosWhere={AND:[equipeDe(id),projetosVisiveis(req.usuario.id)]};
 const [projetos,totalProjetos]=await Promise.all([prisma.projeto.findMany({where:projetosWhere,select:{id:true,nome:true,status:true,tags:true},orderBy:{dataAtualizacao:'desc'},take:3}),prisma.projeto.count({where:projetosWhere})]);
 res.json({usuario,conexao,projetos,podeEnviar:await podeEnviar(req.usuario.id,id),estatisticas:{conexoes:totalConexoes,visitas:totalVisitas,habilidades:usuario.habilidades.length,projetos:totalProjetos}});
}));
router.post('/usuarios/:id/visita',rota(async(req,res)=>{
 const id=idValido(req.params.id);
 const usuario=await prisma.usuario.findFirst({where:{AND:[{id},visivelPara(req.usuario.id)]},select:{id:true}});
 if(!usuario) throw erroHttp('Perfil não encontrado.',404);
 if(id!==req.usuario.id) await prisma.visitaPerfil.upsert({where:{usuarioId_visitanteId:{usuarioId:id,visitanteId:req.usuario.id}},create:{usuarioId:id,visitanteId:req.usuario.id},update:{dataAtualizacao:new Date()}});
 res.status(204).end();
}));
router.patch('/configuracoes',rota(async(req,res)=>{
 const dados=z.object({perfilPublico:z.boolean().optional(),mensagensPublicas:z.boolean().optional(),tema:z.enum(['escuro','claro']).optional(),fonteAmpliada:z.boolean().optional()}).strict().parse(req.body);
 const usuario=await prisma.usuario.update({where:{id:req.usuario.id},data:dados,select:meuPerfilSelect});
 res.json({usuario,mensagem:'Preferências salvas.'});
}));
router.patch('/configuracoes/senha',rota(async(req,res)=>{
 const dados=z.object({senhaAtual:z.string().min(1),novaSenha:z.string().min(8).refine(s=>Buffer.byteLength(s,'utf8')<=72,'A senha deve ter até 72 bytes.'),confirmacao:z.string()}).strict().refine(d=>d.novaSenha===d.confirmacao,{message:'As senhas não coincidem.',path:['confirmacao']}).parse(req.body);
 const usuario=await prisma.usuario.findUnique({where:{id:req.usuario.id},select:{senha:true}});
 if(!await bcrypt.compare(dados.senhaAtual,usuario.senha)) throw erroHttp('A senha atual está incorreta.');
 await prisma.usuario.update({where:{id:req.usuario.id},data:{senha:await bcrypt.hash(dados.novaSenha,12)}});
 res.json({mensagem:'Senha atualizada.'});
}));
router.get('/mensagens',rota(async(req,res)=>{
 const id=req.usuario.id;
 const where={OR:[{remetenteId:id},{destinatarioId:id}]};
 const grupos=await prisma.mensagem.groupBy({by:['remetenteId','destinatarioId'],where,_max:{id:true}});
 const ultimos=new Map();
 for(const g of grupos){const outro=g.remetenteId===id?g.destinatarioId:g.remetenteId;ultimos.set(outro,Math.max(ultimos.get(outro)||0,g._max.id));}
 const [mensagens,naoLidas]=await Promise.all([prisma.mensagem.findMany({where:{id:{in:[...ultimos.values()]}},include:{remetente:{select:perfilSelect},destinatario:{select:perfilSelect}},orderBy:{id:'desc'}}),prisma.mensagem.groupBy({by:['remetenteId'],where:{destinatarioId:id,lidaEm:null},_count:{id:true}})]);
 res.json({conversas:mensagens.map(m=>({usuario:m.remetenteId===id?m.destinatario:m.remetente,ultimaMensagem:{id:m.id,texto:m.texto,dataCriacao:m.dataCriacao},naoLidas:naoLidas.find(g=>g.remetenteId===(m.remetenteId===id?m.destinatarioId:m.remetenteId))?._count.id||0}))});
}));
router.get('/mensagens/:id',rota(async(req,res)=>{
 const id=idValido(req.params.id),eu=req.usuario.id;
 const consulta=z.object({antes:z.coerce.number().int().positive().optional(),depois:z.coerce.number().int().nonnegative().optional()}).strict().refine(d=>!(d.antes&&d.depois),{message:'Use apenas um cursor.'}).parse(req.query);
 const where={OR:[{remetenteId:eu,destinatarioId:id},{remetenteId:id,destinatarioId:eu}]};
 const permitido=await podeEnviar(eu,id);
 if(!permitido && !(await prisma.mensagem.findFirst({where,select:{id:true}}))) throw erroHttp('Este usuário recebe mensagens apenas de conexões aceitas.',403);
 const usuario=await prisma.usuario.findUnique({where:{id},select:perfilSelect});
 if(!usuario) throw erroHttp('Usuário não encontrado.',404);
 const mensagens=await prisma.mensagem.findMany({where:{...where,...(consulta.antes?{id:{lt:consulta.antes}}:consulta.depois!==undefined?{id:{gt:consulta.depois}}:{})},orderBy:{id:consulta.depois!==undefined?'asc':'desc'},take:50});
 const recebidas=mensagens.filter(m=>m.destinatarioId===eu && !m.lidaEm).map(m=>m.id);
 if(recebidas.length) await prisma.mensagem.updateMany({where:{id:{in:recebidas},destinatarioId:eu,lidaEm:null},data:{lidaEm:new Date()}});
 res.json({usuario,podeEnviar:permitido,mensagens:consulta.depois!==undefined?mensagens:mensagens.reverse(),temMais:mensagens.length===50});
}));
router.post('/mensagens/:id',rota(async(req,res)=>{
 const destinatarioId=idValido(req.params.id),remetenteId=req.usuario.id;
 const {texto}=z.object({texto:z.string().trim().min(1,'Digite uma mensagem.').max(2000,'A mensagem deve ter até 2000 caracteres.')}).strict().parse(req.body);
 const mensagem=await prisma.$transaction(async tx=>{
  if(!await podeEnviar(remetenteId,destinatarioId,tx)) throw erroHttp('Este usuário recebe mensagens apenas de conexões aceitas.',403);
  const m=await tx.mensagem.create({data:{remetenteId,destinatarioId,texto}});
  await tx.notificacao.create({data:{usuarioId:destinatarioId,atorId:remetenteId,tipo:'MENSAGEM'}});
  return m;
 });
 res.status(201).json({mensagem});
}));
router.get('/notificacoes',rota(async(req,res)=>{
 const {pagina,q}=paginaSchema.extend({q:z.string().trim().max(120).default('')}).strict().parse(req.query);
 const normalizar=s=>s.normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase('pt-BR');
 const descricoes={SOLICITACAO:'enviou uma solicitação de conexão',CONEXAO_ACEITA:'aceitou sua solicitação de conexão',MENSAGEM:'enviou uma mensagem para você',PROJETO_CONVITE:'convidou você para um projeto'};
 const tipos=Object.entries(descricoes).filter(([,texto])=>normalizar(texto).includes(normalizar(q))).map(([tipo])=>tipo);
 const where={usuarioId:req.usuario.id,...(q?{OR:[{ator:{nome:{contains:q}}},{tipo:{in:tipos}},{projeto:{nome:{contains:q}}}]}:{})};
 const [notificacoes,total,naoLidas]=await prisma.$transaction([prisma.notificacao.findMany({where,include:{ator:{select:{id:true,nome:true,fotoPerfil:true}}},orderBy:{id:'desc'},skip:(pagina-1)*20,take:20}),prisma.notificacao.count({where}),prisma.notificacao.count({where:{...where,lidaEm:null}})]);
 res.json({notificacoes,total,naoLidas,pagina,paginas:Math.ceil(total/20)});
}));
router.patch('/notificacoes/lidas',rota(async(req,res)=>{
 await prisma.notificacao.updateMany({where:{usuarioId:req.usuario.id,lidaEm:null},data:{lidaEm:new Date()}});res.status(204).end();
}));
router.patch('/notificacoes/:id',rota(async(req,res)=>{
 const {count}=await prisma.notificacao.updateMany({where:{id:idValido(req.params.id),usuarioId:req.usuario.id},data:{lidaEm:new Date()}});
 if(!count) throw erroHttp('Notificação não encontrada.',404);res.status(204).end();
}));
router.delete('/notificacoes/:id',rota(async(req,res)=>{
 const {count}=await prisma.notificacao.deleteMany({where:{id:idValido(req.params.id),usuarioId:req.usuario.id}});
 if(!count) throw erroHttp('Notificação não encontrada.',404);res.status(204).end();
}));
router.get('/painel',rota(async(req,res)=>{
 const id=req.usuario.id;
 const [conexoes,solicitacoes,mensagens,visitas,atividades]=await Promise.all([prisma.conexao.count({where:{status:'ACEITA',OR:[{solicitanteId:id},{destinatarioId:id}]}}),prisma.conexao.count({where:{destinatarioId:id,status:'PENDENTE'}}),prisma.mensagem.count({where:{destinatarioId:id,lidaEm:null}}),prisma.visitaPerfil.count({where:{usuarioId:id}}),prisma.notificacao.findMany({where:{usuarioId:id},include:{ator:{select:{id:true,nome:true,fotoPerfil:true}}},orderBy:{id:'desc'},take:5})]);
 const projetos=await prisma.projeto.count({where:{AND:[equipeDe(id),{status:'ATIVO'}]}});
 res.json({conexoes,solicitacoes,mensagens,visitas,atividades,projetos});
}));
export default router;
