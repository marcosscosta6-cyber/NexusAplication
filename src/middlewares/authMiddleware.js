
import "dotenv/config";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";

export async function authMiddleware(req, res, next) {
  const token = req.cookies?.nexusToken;

  if (!token) {
    return res.status(401).json({
      mensagem: "Faça login para continuar.",
    });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      mensagem: "A configuração de autenticação está incompleta.",
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (typeof payload !== "object" || !payload.sub) {
      return res.status(401).json({
        mensagem: "Token inválido.",
      });
    }

    const id = Number(payload.sub);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(401).json({
        mensagem: "Token inválido.",
      });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        situacao: true,
      },
    });

    if (!usuario || usuario.situacao !== "APROVADO") {
      return res.status(403).json({
        mensagem: "Sua conta não está autorizada a acessar este recurso.",
      });
    }

    req.usuario = usuario;
    return next();
  } catch (erro) {
    if (erro.name === "JsonWebTokenError" ||
        erro.name === "TokenExpiredError" ||
        erro.name === "NotBeforeError") {
      return res.status(401).json({
        mensagem: "Sessão inválida ou expirada. Faça login novamente.",
      });
    }

    return res.status(500).json({
      mensagem: "Erro ao verificar a autenticação.",
    });
  }
}
