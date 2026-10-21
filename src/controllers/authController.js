
import "dotenv/config";
import { z } from "zod";
import { realizarLogin } from "../services/authService.js";

const loginSchema = z.object({
  identificador: z.string().trim().min(1, "Informe seu e-mail ou usuário."),
  senha: z.string().min(1, "Informe sua senha."),
});

const producao = process.env.NODE_ENV === "production";

const opcoesCookie = {
  httpOnly: true,
  secure: producao,
  sameSite: producao ? "none" : "lax",
  path: "/",
  maxAge: 2 * 60 * 60 * 1000,
};

export async function loginController(req, res) {
  const validacao = loginSchema.safeParse(req.body);

  if (!validacao.success) {
    return res.status(400).json({
      mensagem: validacao.error.issues[0].message,
    });
  }

  try {
    const resultado = await realizarLogin(
      validacao.data.identificador,
      validacao.data.senha
    );

    res.cookie("nexusToken", resultado.token, opcoesCookie);

    return res.status(200).json({
      mensagem: "Login realizado com sucesso!",
      usuario: resultado.usuario,
    });
  } catch (erro) {
    const status = erro.status || 500;

    return res.status(status).json({
      mensagem:
        status < 500
          ? erro.message
          : "Erro interno do servidor.",
    });
  }
}

export function logoutController(_req, res) {
  res.clearCookie("nexusToken", {
    httpOnly: true,
    secure: producao,
    sameSite: producao ? "none" : "lax",
    path: "/",
  });

  return res.status(200).json({
    mensagem: "Logout realizado com sucesso.",
  });
}
