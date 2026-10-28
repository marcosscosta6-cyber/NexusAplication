
import { prisma } from "../config/prisma.js";

export const usuarioModel = {
  buscarPorEmail(email) {
    return prisma.usuario.findUnique({
      where: { email },
    });
  },

  buscarPorUsuario(usuario) {
    return prisma.usuario.findUnique({
      where: { usuario },
    });
  },

  criar(dados) {
    return prisma.usuario.create({
      data: dados,
      select: {
        id: true,
        nome: true,
        email: true,
        usuario: true,
        dataCadastro: true,
      },
    });
  },

  buscarPorId(id) {
    return prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        usuario: true,
        dataCadastro: true,
      },
    });
  },

  buscarSituacaoPorId(id) {
    return prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        situacao: true,
      },
    });
  },
};
