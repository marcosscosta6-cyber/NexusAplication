
import { conexaoModel } from "../models/conexaoModel.js";
import { prisma } from "../config/prisma.js";
import { visivelPara } from "../utils/perfil.js";

function criarErro(mensagem, status = 400) {
  const erro = new Error(mensagem);
  erro.status = status;
  return erro;
}

export const conexaoService = {
  async solicitarConexao(solicitanteId, destinatarioId) {
    // Verifica se o ID recebido é válido.
    if (!Number.isSafeInteger(destinatarioId) || destinatarioId <= 0 || destinatarioId > 2147483647) {
      throw criarErro("ID do usuário destinatário inválido.");
    }

    // Impede que o usuário envie uma solicitação para si mesmo.
    if (solicitanteId === destinatarioId) {
      throw criarErro("Você não pode enviar uma solicitação para si mesmo.");
    }

    // Verifica se o destinatário existe.
    const destinatario = await prisma.usuario.findFirst({
      where: { AND: [{ id: destinatarioId }, visivelPara(solicitanteId)] },
      select: { id: true },
    });

    if (!destinatario) {
      throw criarErro("Usuário não encontrado.", 404);
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

      const reaberta = await conexaoModel.reabrir(conexaoExistente.id, solicitanteId, destinatarioId);
      if (!reaberta) {
        throw criarErro("Esta solicitação já foi alterada. Atualize a lista.", 409);
      }
      return reaberta;
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
    if (!Number.isSafeInteger(conexaoId) || conexaoId <= 0 || conexaoId > 2147483647) {
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

    // O banco também verifica o estado para impedir respostas simultâneas.
    const resultado = await conexaoModel.atualizarStatus(conexaoId, usuarioId, decisao);
    if (!resultado.count) {
      throw criarErro("Esta solicitação já foi respondida ou removida.", 409);
    }
    return { id: conexaoId, status: decisao };
  },

  async remover(conexaoId, usuarioId) {
    if (!Number.isInteger(conexaoId) || conexaoId <= 0 || conexaoId > 2147483647) {
      throw criarErro("ID da conexão inválido.");
    }
    const resultado = await conexaoModel.remover(conexaoId, usuarioId);
    if (!resultado.count) {
      throw criarErro("Conexão não encontrada ou ação não permitida.", 404);
    }
  },
};
