import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { erroHttp, idValido, par } from '../utils/perfil.js';

const router = Router();
router.use(authMiddleware);
const pessoa = { id: true, nome: true, fotoPerfil: true };
const incluir = {
  proprietario: { select: pessoa },
  participantes: { include: { usuario: { select: pessoa } }, orderBy: { id: 'asc' } },
  etapas: { orderBy: { id: 'asc' } },
};
const normalizar = valor => valor.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('pt-BR');
const campos = z.object({
  nome: z.string().trim().min(3, 'O título precisa ter pelo menos 3 caracteres.').max(120, 'Use até 120 caracteres no título.'),
  descricao: z.string().trim().min(10, 'Descreva o projeto com pelo menos 10 caracteres.').max(5000, 'A descrição deve ter até 5000 caracteres.'),
  tags: z.array(z.string().trim().min(1).max(24, 'Cada tag deve ter até 24 caracteres.')).max(8, 'Use até 8 tags.').refine(tags => new Set(tags.map(normalizar)).size === tags.length, 'Não repita tags.'),
  publico: z.boolean(),
  status: z.enum(['ATIVO', 'PAUSADO', 'CONCLUIDO']),
}).strict();
const criarSchema = campos.omit({ status: true }).extend({ tags: campos.shape.tags.default([]), publico: z.boolean().default(true) });
const editarSchema = campos.partial().refine(dados => Object.keys(dados).length > 0, 'Informe ao menos um campo.');
export const equipeDe = usuarioId => ({ OR: [{ proprietarioId: usuarioId }, { participantes: { some: { usuarioId, aceita: true } } }] });
export const projetosVisiveis = usuarioId => ({ OR: [{ publico: true }, equipeDe(usuarioId)] });
const rota = funcao => async (req, res, next) => {
  try { await funcao(req, res); }
  catch (erro) {
    if (erro instanceof z.ZodError) return res.status(400).json({ mensagem: 'Confira os campos do projeto.', erros: erro.issues.map(e => ({ campo: e.path.join('.'), mensagem: e.message })) });
    if (erro.code === 'P2002') return res.status(409).json({ mensagem: 'Esta pessoa já participa ou tem um convite pendente.' });
    next(erro);
  }
};
async function exigirDono(db, projetoId, usuarioId) {
  const projeto = await db.projeto.findFirst({ where: { id: projetoId, proprietarioId: usuarioId }, select: { id: true } });
  if (!projeto) throw erroHttp('Projeto não encontrado ou você não pode alterá-lo.', 404);
}
function apresentar(projeto, usuarioId) {
  const souDono = projeto.proprietarioId === usuarioId;
  return { ...projeto, souDono, souMembro: souDono || projeto.participantes.some(p => p.usuarioId === usuarioId && p.aceita), participantes: projeto.participantes.filter(p => souDono || p.aceita || p.usuarioId === usuarioId) };
}
router.get('/', rota(async (req, res) => {
  const { aba, pagina, q } = z.object({ aba: z.enum(['meus', 'explorar']).default('meus'), pagina: z.coerce.number().int().min(1).max(10000).default(1), q: z.string().trim().max(120).default('') }).strict().parse(req.query);
  const where = { AND: [aba === 'meus' ? equipeDe(req.usuario.id) : { publico: true, proprietarioId: { not: req.usuario.id } }, ...(q ? [{ nome: { contains: q } }] : [])] };
  const [registros, total] = await prisma.$transaction([
    prisma.projeto.findMany({ where, include: incluir, orderBy: [{ dataAtualizacao: 'desc' }, { id: 'desc' }], skip: (pagina - 1) * 12, take: 12 }),
    prisma.projeto.count({ where }),
  ]);
  res.json({ projetos: registros.map(p => apresentar(p, req.usuario.id)), total, pagina, paginas: Math.ceil(total / 12) });
}));
router.post('/', rota(async (req, res) => {
  const dados = criarSchema.parse(req.body);
  const projeto = await prisma.projeto.create({ data: { ...dados, proprietarioId: req.usuario.id }, include: incluir });
  res.status(201).json({ projeto: apresentar(projeto, req.usuario.id) });
}));
router.get('/convites', rota(async (req, res) => {
  const convites = await prisma.participacaoProjeto.findMany({ where: { usuarioId: req.usuario.id, aceita: false }, select: { id: true, projetoId: true, projeto: { select: { id: true, nome: true, publico: true, proprietario: { select: pessoa } } } }, orderBy: { id: 'desc' } });
  res.json({ convites });
}));
router.get('/:id', rota(async (req, res) => {
  const projeto = await prisma.projeto.findFirst({ where: { AND: [{ id: idValido(req.params.id) }, projetosVisiveis(req.usuario.id)] }, include: incluir });
  if (!projeto) throw erroHttp('Projeto não encontrado ou acesso restrito à equipe.', 404);
  res.json({ projeto: apresentar(projeto, req.usuario.id) });
}));
router.patch('/:id', rota(async (req, res) => {
  const id = idValido(req.params.id), dados = editarSchema.parse(req.body);
  const projeto = await prisma.$transaction(async tx => {
    const resultado = await tx.projeto.updateMany({ where: { id, proprietarioId: req.usuario.id }, data: dados });
    if (!resultado.count) throw erroHttp('Projeto não encontrado ou você não pode alterá-lo.', 404);
    return tx.projeto.findUnique({ where: { id }, include: incluir });
  });
  res.json({ projeto: apresentar(projeto, req.usuario.id), mensagem: 'Projeto atualizado.' });
}));
router.post('/:id/convites', rota(async (req, res) => {
  const projetoId = idValido(req.params.id);
  const { usuarioId } = z.object({ usuarioId: z.number().int().positive().max(2147483647) }).strict().parse(req.body);
  await prisma.$transaction(async tx => {
    await exigirDono(tx, projetoId, req.usuario.id);
    if (usuarioId === req.usuario.id) throw erroHttp('Você já é o proprietário do projeto.');
    const conexao = await tx.conexao.findFirst({ where: { ...par(req.usuario.id, usuarioId), status: 'ACEITA' }, select: { id: true } });
    if (!conexao) throw erroHttp('Convide uma pessoa com conexão aceita.', 403);
    await tx.participacaoProjeto.create({ data: { projetoId, usuarioId } });
    await tx.notificacao.create({ data: { projetoId, usuarioId, atorId: req.usuario.id, tipo: 'PROJETO_CONVITE' } });
  });
  res.status(201).json({ mensagem: 'Convite enviado.' });
}));
router.patch('/:id/convite', rota(async (req, res) => {
  const projetoId = idValido(req.params.id);
  const { aceitar } = z.object({ aceitar: z.boolean() }).strict().parse(req.body);
  const where = { projetoId, usuarioId: req.usuario.id, aceita: false };
  const resultado = aceitar ? await prisma.participacaoProjeto.updateMany({ where, data: { aceita: true } }) : await prisma.participacaoProjeto.deleteMany({ where });
  if (!resultado.count) throw erroHttp('Convite não encontrado ou já respondido.', 404);
  res.json({ mensagem: aceitar ? 'Você entrou na equipe.' : 'Convite recusado.' });
}));
router.delete('/:id/participantes/:usuarioId', rota(async (req, res) => {
  const resultado = await prisma.participacaoProjeto.deleteMany({ where: { projetoId: idValido(req.params.id), usuarioId: idValido(req.params.usuarioId), projeto: { proprietarioId: req.usuario.id } } });
  if (!resultado.count) throw erroHttp('Participante não encontrado ou ação não permitida.', 404);
  res.status(204).end();
}));
router.post('/:id/sair', rota(async (req, res) => {
  const resultado = await prisma.participacaoProjeto.deleteMany({ where: { projetoId: idValido(req.params.id), usuarioId: req.usuario.id, aceita: true } });
  if (!resultado.count) throw erroHttp('Você não participa deste projeto ou é seu proprietário.', 400);
  res.status(204).end();
}));
router.post('/:id/etapas', rota(async (req, res) => {
  const projetoId = idValido(req.params.id);
  const { titulo } = z.object({ titulo: z.string().trim().min(3, 'Dê um título à etapa.').max(160) }).strict().parse(req.body);
  const etapa = await prisma.$transaction(async tx => { await exigirDono(tx, projetoId, req.usuario.id); return tx.etapaProjeto.create({ data: { projetoId, titulo } }); });
  res.status(201).json({ etapa });
}));
router.patch('/:id/etapas/:etapaId', rota(async (req, res) => {
  const dados = z.object({ concluida: z.boolean() }).strict().parse(req.body);
  const resultado = await prisma.etapaProjeto.updateMany({ where: { id: idValido(req.params.etapaId), projetoId: idValido(req.params.id), projeto: { proprietarioId: req.usuario.id } }, data: dados });
  if (!resultado.count) throw erroHttp('Etapa não encontrada ou ação não permitida.', 404);
  res.json({ mensagem: 'Etapa atualizada.' });
}));
export default router;
