
import { Router } from "express";

import { authMiddleware } from "../middlewares/authMiddleware.js";

import {
  solicitarConexaoController,
  listarRecebidasController,
  listarEnviadasController,
  listarConexoesController,
  responderSolicitacaoController,
} from "../controllers/conexaoController.js";

const router = Router();

// Todas as rotas exigem autenticação.
router.use(authMiddleware);

// Enviar uma solicitação de conexão.
router.post("/", solicitarConexaoController);

// Listar solicitações recebidas pendentes.
router.get("/recebidas", listarRecebidasController);

// Listar solicitações enviadas pendentes.
router.get("/enviadas", listarEnviadasController);

// Listar conexões aceitas.
router.get("/", listarConexoesController);

// Aceitar ou recusar uma solicitação específica.
router.patch("/:id/responder", responderSolicitacaoController);

export default router;
