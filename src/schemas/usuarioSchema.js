
import { z } from "zod";

export const cadastroUsuarioSchema = z.object({
  nome: z.string().trim().min(3, "Informe seu nome completo").max(120),

  email: z.string().trim().email("E-mail inválido").max(191),

  usuario: z.string().trim().min(3, "O usuário precisa ter pelo menos 3 caracteres").max(50)
    .regex(/^[a-zA-Z0-9_.-]+$/, "Use apenas letras, números, ponto, hífen ou underline"),

  senha: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres").max(72),

  confirm: z.string(),

  dataNasc: z.coerce.date(),

  escolaridade: z.enum([
    "fundamentalCom",
    "fundamentalAn",
    "medioCom",
    "medioAn",
    "mediotec",
    "mediotecAn",
    "tecCom",
    "tecAn",
    "superiorCom",
    "superiorAn",
  ]),
}).refine((dados) => dados.senha === dados.confirm, {
  message: "As senhas não coincidem",
  path: ["confirm"],
});
