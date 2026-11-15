
import { prisma } from "../config/prisma.js";

export const conexaoModel = {
  // Procura uma solicitação entre dois usuários, em qualquer direção.
  buscarEntreUsuarios(usuarioId, outroUsuarioId) {
    return prisma.conexao.findFirst({
      where: {
        OR: [
          {
            solicitanteId: usuarioId,
            destinatarioId: outroUsuarioId,
          },
          {
            solicitanteId: outroUsuarioId,
            destinatarioId: usuarioId,
          },
        ],
      },
    });
  },

  // Cria uma solicitação de conexão.
  criar(solicitanteId, destinatarioId) {
    return prisma.$transaction(async (tx) => {
      const conexao = await tx.conexao.create({
      data: {
        solicitanteId,
        destinatarioId,
        parMenorId: Math.min(solicitanteId, destinatarioId),
        parMaiorId: Math.max(solicitanteId, destinatarioId),
      },
      });
      await tx.notificacao.create({ data: { usuarioId: destinatarioId, atorId: solicitanteId, tipo: "SOLICITACAO" } });
      return conexao;
    });
  },

  // Reabre uma solicitação recusada de forma atômica.
  reabrir(id, solicitanteId, destinatarioId) {
    return prisma.$transaction(async (tx) => {
      const resultado = await tx.conexao.updateMany({
        where: { id, status: "RECUSADA" },
        data: {
          solicitanteId,
          destinatarioId,
          status: "PENDENTE",
          dataCriacao: new Date(),
        },
      });
      if (!resultado.count) return null;
      await tx.notificacao.create({ data: { usuarioId: destinatarioId, atorId: solicitanteId, tipo: "SOLICITACAO" } });
      return tx.conexao.findUnique({ where: { id } });
    });
  },

  // Lista as solicitações recebidas pelo usuário.
  listarRecebidas(usuarioId) {
    return prisma.conexao.findMany({
      where: {
        destinatarioId: usuarioId,
        status: "PENDENTE",
      },
      include: {
        solicitante: {
          select: {
            id: true,
            nome: true,
            usuario: true,
            fotoPerfil: true,
            area: true,
            curso: true,
          },
        },
      },
      orderBy: {
        dataCriacao: "desc",
      },
    });
  },

  // Lista as solicitações enviadas pelo usuário.
  listarEnviadas(usuarioId) {
    return prisma.conexao.findMany({
      where: {
        solicitanteId: usuarioId,
        status: "PENDENTE",
      },
      include: {
        destinatario: {
          select: {
            id: true,
            nome: true,
            usuario: true,
            fotoPerfil: true,
            area: true,
            curso: true,
          },
        },
      },
      orderBy: {
        dataCriacao: "desc",
      },
    });
  },

  // Busca uma solicitação recebida pelo ID e pelo destinatário.
  buscarRecebidaPorId(conexaoId, usuarioId) {
    return prisma.conexao.findFirst({
      where: {
        id: conexaoId,
        destinatarioId: usuarioId,
        status: "PENDENTE",
      },
    });
  },

  // Atualiza o status de uma solicitação.
  atualizarStatus(conexaoId, usuarioId, status) {
    return prisma.$transaction(async (tx) => {
      const conexao = await tx.conexao.findFirst({ where: { id: conexaoId, destinatarioId: usuarioId, status: "PENDENTE" } });
      if (!conexao) return { count: 0 };
      const resultado = await tx.conexao.updateMany({
      where: {
        id: conexaoId,
        destinatarioId: usuarioId,
        status: "PENDENTE",
      },
      data: {
        status,
      },
      });
      if (resultado.count && status === "ACEITA") {
        await tx.notificacao.create({ data: { usuarioId: conexao.solicitanteId, atorId: usuarioId, tipo: "CONEXAO_ACEITA" } });
      }
      return resultado;
    });
  },

  remover(conexaoId, usuarioId) {
    return prisma.conexao.deleteMany({
      where: {
        id: conexaoId,
        OR: [
          { solicitanteId: usuarioId, status: "PENDENTE" },
          { status: "ACEITA", OR: [{ solicitanteId: usuarioId }, { destinatarioId: usuarioId }] },
        ],
      },
    });
  },

  // Lista todas as conexões aceitas do usuário.
  listarAceitas(usuarioId) {
    return prisma.conexao.findMany({
      where: {
        status: "ACEITA",
        OR: [
          { solicitanteId: usuarioId },
          { destinatarioId: usuarioId },
        ],
      },
      include: {
        solicitante: {
          select: {
            id: true,
            nome: true,
            usuario: true,
            fotoPerfil: true,
            area: true,
            curso: true,
          },
        },
        destinatario: {
          select: {
            id: true,
            nome: true,
            usuario: true,
            fotoPerfil: true,
            area: true,
            curso: true,
          },
        },
      },
      orderBy: {
        dataAtualizacao: "desc",
      },
    });
  },
};
