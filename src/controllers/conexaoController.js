
import { conexaoService } from "../services/conexaoService.js";

function responderErro(res, erro) {
  const status = erro.status || 500;

  return res.status(status).json({
    mensagem:
      status < 500
        ? erro.message
        : "Erro interno do servidor.",
  });
}

export async function solicitarConexaoController(req, res) {
  try {
    const destinatarioId = Number(req.body.destinatarioId);

    const conexao = await conexaoService.solicitarConexao(
      req.usuario.id,
      destinatarioId
    );

    return res.status(201).json({
      mensagem: "Solicitação de conexão enviada com sucesso.",
      conexao,
    });
  } catch (erro) {
    return responderErro(res, erro);
  }
}

export async function listarRecebidasController(req, res) {
  try {
    const solicitacoes = await conexaoService.listarRecebidas(
      req.usuario.id
    );

    return res.status(200).json({ solicitacoes });
  } catch (erro) {
    return responderErro(res, erro);
  }
}

export async function listarEnviadasController(req, res) {
  try {
    const solicitacoes = await conexaoService.listarEnviadas(
      req.usuario.id
    );

    return res.status(200).json({ solicitacoes });
  } catch (erro) {
    return responderErro(res, erro);
  }
}

export async function listarConexoesController(req, res) {
  try {
    const conexoes = await conexaoService.listarConexoes(
      req.usuario.id
    );

    return res.status(200).json({ conexoes });
  } catch (erro) {
    return responderErro(res, erro);
  }
}

export async function responderSolicitacaoController(req, res) {
  try {
    const conexaoId = Number(req.params.id);
    const decisao = req.body.decisao;

    const conexao = await conexaoService.responderSolicitacao(
      conexaoId,
      req.usuario.id,
      decisao
    );

    return res.status(200).json({
      mensagem:
        decisao === "ACEITA"
          ? "Solicitação aceita com sucesso."
          : "Solicitação recusada com sucesso.",
      conexao,
    });
  } catch (erro) {
    return responderErro(res, erro);
  }
}
