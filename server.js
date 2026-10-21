
import express from "express";
import cors from "cors";
import usuarioRoutes from "./src/routes/usuarioRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_req, res) => {
  res.json({ mensagem: "API NEXUS funcionando!" });
});

app.use("/api/usuarios", usuarioRoutes);

app.use((erro, _req, res, _next) => {
  console.error(erro.message);

  if (erro.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      mensagem: "O comprovante deve ter no máximo 5 MB.",
    });
  }

  if (erro.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      mensagem: "Envie apenas um comprovante no campo correto.",
    });
  }

  return res.status(erro.status || 500).json({
    mensagem:
      erro.status && erro.status < 500
        ? erro.message
        : "Erro interno do servidor.",
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API NEXUS rodando na porta ${PORT}`);
});
