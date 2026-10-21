
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
    next(erro);
  }
}
