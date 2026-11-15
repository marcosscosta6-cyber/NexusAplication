
import { unlink } from "node:fs/promises";
import { cadastroUsuarioSchema } from "../schemas/usuarioSchema.js";
import { cadastrarUsuario } from "../services/usuarioServices.js";

async function apagarArquivo(arquivo) {
  if (arquivo?.path) {
    await unlink(arquivo.path).catch(() => {});
  }
}

export async function cadastrarUsuarioController(req, res, next) {
  const validacao = cadastroUsuarioSchema.safeParse(req.body);

  if (!validacao.success) {
    await apagarArquivo(req.file);

    return res.status(400).json({
      mensagem: "Confira os dados do cadastro.",
      erros: validacao.error.issues.map((erro) => ({
        campo: erro.path.join("."),
        mensagem: erro.message,
      })),
    });
  }

  try {
    const usuario = await cadastrarUsuario(validacao.data, req.file);

    return res.status(201).json({
      mensagem: "Cadastro recebido com sucesso.",
      usuario,
    });
  } catch (erro) {
    await apagarArquivo(req.file);
    if (erro.campo) {
      return res.status(erro.status || 400).json({
        mensagem: "Confira os dados do cadastro.",
        erros: [{ campo: erro.campo, mensagem: erro.message }],
      });
    }
    if (erro.code === "P2002") {
      return res.status(409).json({
        mensagem: "E-mail ou usuário já cadastrado. Confira esses dois campos ou entre na sua conta.",
        erros: ["email", "usuario"].map(campo => ({ campo, mensagem: "Este e-mail ou usuário já está cadastrado. Confira os dois campos." })),
      });
    }
    next(erro);
  }
}
