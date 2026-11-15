
import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "node:url";
import { prisma } from "./src/config/prisma.js";

import usuarioRoutes from "./src/routes/usuarioRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import conexaoRoutes from "./src/routes/conexaoRoutes.js";
import plataformaRoutes from "./src/routes/plataformaRoutes.js";
import projetoRoutes from "./src/routes/projetoRoutes.js";

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
app.use("/api", (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
app.get("/", (_req, res) => {
  return res.redirect("/FrontEnd/inicio/index.html");
});
app.use(express.static(fileURLToPath(new URL("./public/", import.meta.url))));
app.use("/media/perfis", express.static(fileURLToPath(new URL("./uploads/perfis/", import.meta.url)), { dotfiles: "deny" }));

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

// Rotas de conexões entre usuários
app.use("/api/conexoes", conexaoRoutes);
app.use("/api/projetos", projetoRoutes);
app.use("/api", plataformaRoutes);

// Tratamento de erros
app.use((erro, _req, res, _next) => {
  const status = erro.code === "P2002" ? 409
    : erro.code === "LIMIT_FILE_SIZE" ? 400
    : erro.status || 500;
  if (status >= 500) console.error(erro);
  return res.status(status).json({
    mensagem: erro.code === "P2002" ? "E-mail ou nome de usuário já cadastrado."
      : erro.code === "LIMIT_FILE_SIZE" ? "O arquivo deve ter no máximo 5 MB."
      : status < 500 ? erro.message : "Ocorreu um erro interno no servidor.",
  });
});

// Inicialização do servidor
const PORT = process.env.PORT || 3000;

await prisma.$connect();
export const server = app.listen(PORT, () => {
  console.log(`API NEXUS rodando em http://localhost:${PORT}`);
});

for (const sinal of ["SIGINT", "SIGTERM"]) {
  process.once(sinal, () => {
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  });
}
