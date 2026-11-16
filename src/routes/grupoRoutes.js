import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { equipeDe } from './projetoRoutes.js';
import { erroHttp, idValido } from '../utils/perfil.js';

const router = Router();
router.use(authMiddleware);
const pessoa = { id: true, nome: true, fotoPerfil: true };
const rota = fn => async (req, res, next) => {
  try { await fn(req, res); }
  catch (erro) {
    if (erro instanceof z.ZodError) return res.status(400).json({ mensagem: erro.issues[0].message });
    next(erro);
  }
};
async function exigirEquipe(db, id, usuarioId) {
  const grupo = await db.grupoChat.findFirst({ where: { id, projeto: equipeDe(usuarioId) }, include: {
    projeto: { select: { id: true, nome: true, proprietario: { select: pessoa }, participantes: { where: { aceita: true }, select: { usuario: { select: pessoa } } } } },
  } });
  if (!grupo) throw erroHttp('Grupo não encontrado ou acesso restrito à equipe.', 404);
  return grupo;
}
router.get('/', rota(async (req, res) => {
  const grupos = await prisma.grupoChat.findMany({ where: { projeto: equipeDe(req.usuario.id) }, select: {
    id: true, nome: true, projetoId: true, mensagens: { orderBy: { id: 'desc' }, take: 1, select: { texto: true, dataCriacao: true } },
  }, orderBy: { id: 'desc' } });
  res.json({ grupos });
}));
router.post('/', rota(async (req, res) => {
  const { projetoId, nome } = z.object({ projetoId: z.number().int().positive(), nome: z.string().trim().min(3, 'Use pelo menos 3 caracteres no nome.').max(120).optional() }).strict().parse(req.body);
  const projeto = await prisma.projeto.findFirst({ where: { id: projetoId, proprietarioId: req.usuario.id }, select: { nome: true } });
  if (!projeto) throw erroHttp('Somente o proprietário pode criar o grupo da equipe.', 403);
  const grupo = await prisma.grupoChat.upsert({ where: { projetoId }, update: {}, create: { projetoId, nome: nome || projeto.nome } });
  res.status(201).json({ grupo });
}));
router.get('/:id', rota(async (req, res) => {
  const id = idValido(req.params.id);
  const { antes, depois } = z.object({ antes: z.coerce.number().int().positive().optional(), depois: z.coerce.number().int().nonnegative().optional() }).strict().refine(q => !(q.antes !== undefined && q.depois !== undefined), 'Use apenas um cursor.').parse(req.query);
  const grupo = await exigirEquipe(prisma, id, req.usuario.id);
  const registros = await prisma.mensagemGrupo.findMany({ where: { grupoId: id, ...(antes ? { id: { lt: antes } } : depois !== undefined ? { id: { gt: depois } } : {}) }, orderBy: { id: depois !== undefined ? 'asc' : 'desc' }, take: 51, include: { remetente: { select: pessoa } } });
  const mensagens = registros.slice(0, 50);
  if (depois === undefined) mensagens.reverse();
  res.json({ grupo: { id: grupo.id, nome: grupo.nome, projetoId: grupo.projetoId, projetoNome: grupo.projeto.nome, integrantes: [grupo.projeto.proprietario, ...grupo.projeto.participantes.map(p => p.usuario)] }, mensagens, temMais: registros.length > 50 });
}));
router.post('/:id/mensagens', rota(async (req, res) => {
  const id = idValido(req.params.id);
  const { texto } = z.object({ texto: z.string().trim().min(1, 'Digite uma mensagem.').max(2000, 'Use até 2000 caracteres.') }).strict().parse(req.body);
  const mensagem = await prisma.$transaction(async tx => {
    await exigirEquipe(tx, id, req.usuario.id);
    return tx.mensagemGrupo.create({ data: { grupoId: id, remetenteId: req.usuario.id, texto }, include: { remetente: { select: pessoa } } });
  });
  res.status(201).json({ mensagem });
}));
export default router;
