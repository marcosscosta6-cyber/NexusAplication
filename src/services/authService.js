
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

  if (!usuario.admin && usuario.situacao !== 'APROVADO') {
    const erro = new Error(usuario.situacao === 'RECUSADO' ? 'Seu cadastro foi recusado. Entre em contato com a administração.' : 'Seu cadastro aguarda aprovação do comprovante pela administração.');
    erro.status = 403;
    throw erro;
  }

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
      admin: usuario.admin,
    },
  };
}
