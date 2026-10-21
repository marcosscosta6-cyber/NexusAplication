
import { Router } from "express";
import { cadastrarUsuarioController } from "../controllers/usuarioController.js";
import { uploadComprovante } from "../middlewares/uploadComprovante.js";

const router = Router();

router.post(
  "/",
  uploadComprovante.single("Comprovante"),
  cadastrarUsuarioController
);

export default router;
