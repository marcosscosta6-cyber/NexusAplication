import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import usuarioRoutes from "./src/routes/usuarioRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";

const app = express();

// Configuração do acesso do frontend à API
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5500",
    credentials: true,
  })
);

// Leitura de JSON, formulários e cookies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rota para verificar se a API está funcionando
app.get("/api/health", (_req, res) => {
  return res.status(200).json({
    mensagem: "API NEXUS funcionando!",
  });
});

// Rotas de cadastro
app.use("/api/usuarios", usuarioRoutes);

// Rotas de login e logout
app.use("/api/auth", authRoutes);

// Tratamento de erros
app.use((erro, _req, res, _next) => {
  console.error(erro);

  return res.status(500).json({
    mensagem: "Ocorreu um erro interno no servidor.",
  });
});

// Inicialização do servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API NEXUS rodando em http://localhost:${PORT}`);
});
