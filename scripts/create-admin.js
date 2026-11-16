import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { parseArgs } from 'node:util';
import { z } from 'zod';
import { prisma } from '../src/config/prisma.js';
try {
  const { values } = parseArgs({ options: { usuario: { type: 'string' }, email: { type: 'string' }, nome: { type: 'string' }, ajuda: { type: 'boolean' } } });
  if (values.ajuda) {
    console.log('Uso: npm run criar-admin -- --usuario admin02 --email pessoa@exemplo.com --nome "Nome do administrador"');
    console.log('Sem opções, usa admin01 e admin01@nexus.example. A senha é gerada automaticamente. Configure DATABASE_URL no .env antes de executar.');
  } else {
  const dados = z.object({
    usuario: z.string().trim().min(3).max(50).regex(/^[a-zA-Z0-9_.-]+$/, 'Usuário: use somente letras, números, ponto, hífen ou underline.').transform(s => s.toLowerCase()),
    email: z.string().trim().email().max(191).transform(s => s.toLowerCase()),
    nome: z.string().trim().min(3).max(120),
  }).parse({ usuario: values.usuario || process.env.ADMIN_USUARIO || 'admin01', email: values.email || process.env.ADMIN_EMAIL || 'admin01@nexus.example', nome: values.nome || 'Administrador Nexus' });
  const { usuario, email } = dados;
  if (await prisma.usuario.findFirst({ where: { OR: [{ usuario }, { email }] } })) throw new Error('Conta já existe. Nenhuma conta foi alterada.');
  const senha = randomBytes(12).toString('base64url');
  await prisma.usuario.create({ data: { ...dados, senha: await bcrypt.hash(senha, 12), admin: true, situacao: 'APROVADO' } });
  console.log('Administrador criado. Usuário: ' + usuario + ' | Senha inicial: ' + senha);
  console.log('Entre pelo login normal do site. Guarde a senha exibida acima.');
  }
} catch (erro) { console.error(erro instanceof z.ZodError ? erro.issues.map(i => i.path.join('.') + ': ' + i.message).join('\n') : erro.code === 'P2002' ? 'Usuário ou e-mail já cadastrado. Nenhuma conta foi alterada.' : erro.message); process.exitCode = 1; }
finally { await prisma.$disconnect(); }
