
import "dotenv/config";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authModel } from "../models/authModel.js";

export async function realizarLogin(identificador, senha) {
  const valor = identificador.trim().toLowerCase();

  const usuario = await authModel.buscarPorIdentificador(valor);

  if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
    const erro = new Error("Usuário ou senha incorretos.");
    erro.status = 401;
    throw erro;
  }

  // A aprovação de comprovantes será implementada em uma próxima etapa.

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET não foi configurado no .env.");
  }

  const token = jwt.sign(
    { situacao: usuario.situacao },
    process.env.JWT_SECRET,
    {
      subject: String(usuario.id),
      expiresIn: "2h",
    }
  );

  return {
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      usuario: usuario.usuario,
      situacao: usuario.situacao,
    },
  };
}
