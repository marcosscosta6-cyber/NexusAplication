
import { conexaoModel } from "../models/conexaoModel.js";
import { usuarioModel } from "../models/usuarioModel.js";

function criarErro(mensagem, status = 400) {
  const erro = new Error(mensagem);
  erro.status = status;
  return erro;
}

export const conexaoService = {
  async solicitarConexao(solicitanteId, destinatarioId) {
    // Verifica se o ID recebido é válido.
    if (!Number.isSafeInteger(destinatarioId) || destinatarioId <= 0) {
      throw criarErro("ID do usuário destinatário inválido.");
    }

    // Impede que o usuário envie uma solicitação para si mesmo.
    if (solicitanteId === destinatarioId) {
      throw criarErro("Você não pode enviar uma solicitação para si mesmo.");
    }

    // Verifica se o destinatário existe.
    const destinatario = await usuarioModel.buscarPorId(destinatarioId);

    if (!destinatario) {
      throw criarErro("Usuário não encontrado.", 404);
    }

    // Verifica se o destinatário já foi aprovado.
    const dadosSituacao = await usuarioModel.buscarSituacaoPorId(
      destinatarioId
    );

    if (!dadosSituacao || dadosSituacao.situacao !== "APROVADO") {
      throw criarErro("Este usuário ainda não está aprovado.", 403);
    }

    // Verifica se já existe uma solicitação ou conexão entre os usuários.
    const conexaoExistente = await conexaoModel.buscarEntreUsuarios(
      solicitanteId,
      destinatarioId
    );

    if (conexaoExistente) {
      if (conexaoExistente.status === "PENDENTE") {
        throw criarErro(
          "Já existe uma solicitação pendente entre vocês.",
          409
        );
      }

      if (conexaoExistente.status === "ACEITA") {
        throw criarErro("Vocês já estão conectados.", 409);
      }

      throw criarErro(
        "Já existe uma solicitação anterior entre vocês. Não é possível enviar outra.",
        409
      );
    }

    // Cria a solicitação.
    return conexaoModel.criar(solicitanteId, destinatarioId);
  },

  async listarRecebidas(usuarioId) {
    return conexaoModel.listarRecebidas(usuarioId);
  },

  async listarEnviadas(usuarioId) {
    return conexaoModel.listarEnviadas(usuarioId);
  },

  async listarConexoes(usuarioId) {
    return conexaoModel.listarAceitas(usuarioId);
  },

  async responderSolicitacao(conexaoId, usuarioId, decisao) {
    // Valida o ID da solicitação.
    if (!Number.isSafeInteger(conexaoId) || conexaoId <= 0) {
      throw criarErro("ID da solicitação inválido.");
    }

    // Só permite aceitar ou recusar.
    if (!["ACEITA", "RECUSADA"].includes(decisao)) {
      throw criarErro("Decisão inválida. Use ACEITA ou RECUSADA.");
    }

    // Confirma que a solicitação pertence ao usuário que vai responder.
    const solicitacao = await conexaoModel.buscarRecebidaPorId(
      conexaoId,
      usuarioId
    );

    if (!solicitacao) {
      throw criarErro(
        "Solicitação não encontrada, já respondida ou você não tem permissão para respondê-la.",
        404
      );
    }

    // Atualiza o status da solicitação.
    return conexaoModel.atualizarStatus(conexaoId, decisao);
  },
};
