
import { prisma } from "../config/prisma.js";

export const authModel = {
  buscarPorIdentificador(identificador) {
    return prisma.usuario.findFirst({
      where: {
        OR: [
          { email: identificador },
          { usuario: identificador },
        ],
      },
    });
  },
};
