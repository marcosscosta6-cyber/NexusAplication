
import "dotenv/config";
import express from "express";
import cors from "cors";
import prisma from "./src/config/prisma.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Permite receber requisições de outras origens.
app.use(cors());

// Permite receber dados em JSON.
app.use(express.json());
// TUDO TESTE FAZNEDO COM IA POR ENQUANTO.
// Teste para verificar se a API está funcionando.
app.get("/", (req, res) => {
  res.status(200).json({
    mensagem: "API do Nexus funcionando!",
  });
});

// Teste para verificar a conexão com o banco.
app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      mensagem: "API funcionando e banco conectado!",
    });
  } catch (erro) {
    console.error("Erro ao conectar ao banco:", erro);

    res.status(500).json({
      mensagem: "A API está funcionando, mas houve um erro ao acessar o banco.",
    });
  }
});

// Inicia o servidor.
app.listen(PORT, () => {
  console.log(`Nexus rodando em http://localhost:${PORT}`);
});
