import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'node:url';
import { prisma } from '../config/prisma.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { erroHttp, idValido } from '../utils/perfil.js';

const router = Router();
router.use(authMiddleware, (req, res, next) => req.usuario.admin ? next() : res.status(403).json({ mensagem: 'Acesso exclusivo de administradores.' }));
const rota = fn => async (req, res, next) => { try { await fn(req, res); } catch (erro) { if (erro instanceof z.ZodError) return res.status(400).json({ mensagem: erro.issues[0].message }); next(erro); } };
const select = { id: true, nome: true, usuario: true, email: true, escolaridade: true, situacao: true, comprovante: true, dataCadastro: true };
router.get('/cadastros', rota(async (req, res) => {
  const { q, situacao, pagina } = z.object({ q: z.string().trim().max(120).default(''), situacao: z.enum(['PENDENTE', 'APROVADO', 'RECUSADO', 'TODOS']).default('PENDENTE'), pagina: z.coerce.number().int().min(1).max(10000).default(1) }).strict().parse(req.query);
  const where = { admin: false, ...(situacao === 'TODOS' ? {} : { situacao }), ...(q ? { OR: [{ nome: { contains: q } }, { email: { contains: q } }, { usuario: { contains: q } }] } : {}) };
  const [registros, total, contagens] = await prisma.$transaction([
    prisma.usuario.findMany({ where, select, orderBy: [{ dataCadastro: 'desc' }, { id: 'desc' }], take: 12, skip: (pagina - 1) * 12 }),
    prisma.usuario.count({ where }), prisma.usuario.groupBy({ by: ['situacao'], where: { admin: false }, _count: true }),
  ]);
  res.json({ usuarios: registros.map(({ comprovante, ...u }) => ({ ...u, temComprovante: !!comprovante })), total, pagina, paginas: Math.ceil(total / 12), contagens: Object.fromEntries(contagens.map(c => [c.situacao, c._count])) });
}));
router.get('/cadastros/:id', rota(async (req, res) => {
  const u = await prisma.usuario.findFirst({ where: { id: idValido(req.params.id), admin: false }, select: { ...select, analisesRecebidas: { orderBy: { id: 'desc' }, select: { id: true, situacao: true, motivo: true, dataCriacao: true, administrador: { select: { nome: true } } } } } });
  if (!u) throw erroHttp('Cadastro não encontrado.', 404);
  const { comprovante, ...usuario } = u;
  res.json({ usuario: { ...usuario, temComprovante: !!comprovante } });
}));
router.get('/cadastros/:id/comprovante', rota(async (req, res) => {
  const u = await prisma.usuario.findFirst({ where: { id: idValido(req.params.id), admin: false }, select: { comprovante: true } });
  const nome = u?.comprovante?.match(/^uploads\/comprovantes\/([a-f0-9-]+\.(?:pdf|png|jpg|jpeg))$/i)?.[1];
  if (!nome) throw erroHttp('Comprovante não disponível.', 404);
  res.set({ 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "sandbox; default-src 'none'", 'Content-Disposition': 'inline; filename="comprovante.' + nome.split('.').pop() + '"' });
  res.sendFile(fileURLToPath(new URL('../../uploads/comprovantes/' + nome, import.meta.url)), erro => {
    if (erro && !res.headersSent) res.status(erro.code === 'ENOENT' ? 404 : 500).json({ mensagem: 'Não foi possível abrir o comprovante.' });
  });
}));
router.patch('/cadastros/:id', rota(async (req, res) => {
  const id = idValido(req.params.id);
  const dados = z.object({ situacao: z.enum(['APROVADO', 'RECUSADO']), motivo: z.string().trim().max(1000).default('') }).strict().refine(d => d.situacao !== 'RECUSADO' || d.motivo.length >= 5, 'Informe o motivo da recusa com pelo menos 5 caracteres.').parse(req.body);
  await prisma.$transaction(async tx => {
    const usuario = await tx.usuario.findFirst({ where: { id, admin: false }, select: { comprovante: true, situacao: true } });
    if (!usuario) throw erroHttp('Cadastro não encontrado.', 404);
    if (dados.situacao === 'APROVADO' && !usuario.comprovante) throw erroHttp('Não é possível aprovar sem comprovante.');
    if (usuario.situacao === dados.situacao) throw erroHttp('O cadastro já possui essa situação.', 409);
    const r = await tx.usuario.updateMany({ where: { id, admin: false, situacao: usuario.situacao }, data: { situacao: dados.situacao } });
    if (!r.count) throw erroHttp('Este cadastro foi analisado por outra pessoa. Atualize a lista.', 409);
    await tx.analiseCadastro.create({ data: { usuarioId: id, adminId: req.usuario.id, situacao: dados.situacao, motivo: dados.motivo || null } });
  });
  res.json({ mensagem: 'Análise registrada.' });
}));
router.post('/administradores', rota(async (req, res) => {
  const dados = z.object({ nome: z.string().trim().min(3).max(120), usuario: z.string().trim().min(3).max(50).regex(/^[a-zA-Z0-9_.-]+$/).transform(s => s.toLowerCase()), email: z.string().trim().email().max(191).transform(s => s.toLowerCase()), senha: z.string().min(8).refine(s => Buffer.byteLength(s, 'utf8') <= 72, 'Senha deve ter até 72 bytes.') }).strict().parse(req.body);
  const usuario = await prisma.usuario.create({ data: { ...dados, senha: await bcrypt.hash(dados.senha, 12), admin: true, situacao: 'APROVADO' }, select: { id: true, nome: true, usuario: true, email: true } });
  res.status(201).json({ usuario });
}));
export default router;
