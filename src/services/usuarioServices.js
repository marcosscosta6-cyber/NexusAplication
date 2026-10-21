
import bcrypt from "bcryptjs";
import { usuarioModel } from "../models/usuarioModel.js";

export async function cadastrarUsuario(dados, arquivo) {
  if (!arquivo) {
    const erro = new Error("O comprovante é obrigatório.");
    erro.status = 400;
    throw erro;
  }

  const email = dados.email.toLowerCase();
  const usuario = dados.usuario.toLowerCase();

  const usuarioExistente = await usuarioModel.buscarPorUsuario(usuario);

  if (usuarioExistente) {
    const erro = new Error("Este nome de usuário já está cadastrado.");
    erro.status = 409;
    throw erro;
  }

  const emailExistente = await usuarioModel.buscarPorEmail(email);

  if (emailExistente) {
    const erro = new Error("Este e-mail já está cadastrado.");
    erro.status = 409;
    throw erro;
  }

  const senhaHash = await bcrypt.hash(dados.senha, 12);

  const comprovante = `uploads/comprovantes/${arquivo.filename}`;

  return usuarioModel.criar({
    nome: dados.nome,
    email,
    usuario,
    senha: senhaHash,
    dataNasc: dados.dataNasc,
    escolaridade: dados.escolaridade,
    comprovante,
  });
}
