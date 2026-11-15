
import { Router } from "express";
import { cadastrarUsuarioController } from "../controllers/usuarioController.js";
import { uploadComprovante } from "../middlewares/uploadComprovante.js";

const router = Router();

router.post(
  "/",
  (req, res, next) => uploadComprovante.single("Comprovante")(req, res, erro => {
    if (!erro) return next();
    if (erro.status === 400 || erro.name === "MulterError") {
      const mensagem = erro.code === "LIMIT_FILE_SIZE" ? "O comprovante deve ter no máximo 5 MB."
        : erro.code === "LIMIT_UNEXPECTED_FILE" || erro.code === "LIMIT_FILE_COUNT" ? "Envie somente um comprovante."
        : erro.message;
      return res.status(400).json({ mensagem, erros: [{ campo: "Comprovante", mensagem }] });
    }
    return next(erro);
  }),
  cadastrarUsuarioController
);

export default router;
