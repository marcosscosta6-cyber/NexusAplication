
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
    return prisma.conexao.create({
      data: {
        solicitanteId,
        destinatarioId,
      },
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
  atualizarStatus(conexaoId, status) {
    return prisma.conexao.update({
      where: {
        id: conexaoId,
      },
      data: {
        status,
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
