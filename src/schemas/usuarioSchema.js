
import { z } from "zod";

export const cadastroUsuarioSchema = z.object({
  nome: z.string().trim().min(3, "Informe um nome com pelo menos 3 caracteres.").max(120, "O nome deve ter no máximo 120 caracteres."),

  email: z.string().trim().email("Informe um e-mail válido, como nome@exemplo.com.").max(191, "O e-mail deve ter no máximo 191 caracteres."),

  usuario: z.string().trim().min(3, "O usuário precisa ter pelo menos 3 caracteres.").max(50, "O usuário deve ter no máximo 50 caracteres.")
    .regex(/^[a-zA-Z0-9_.-]+$/, "Use apenas letras, números, ponto, hífen ou underline"),

  senha: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.")
    .refine(senha => Buffer.byteLength(senha, "utf8") <= 72, "A senha deve ter no máximo 72 bytes; letras com acento e emojis ocupam mais espaço."),

  confirm: z.string(),

  dataNasc: z.string().refine(valor => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valor) || valor < "1000-01-01") return false;
    const data = new Date(`${valor}T00:00:00Z`);
    return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === valor && data <= new Date();
  }, "Informe uma data de nascimento válida, que não esteja no futuro.")
    .transform(valor => new Date(`${valor}T00:00:00Z`)),

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
  ], { error: "Selecione sua escolaridade." }),
}).refine((dados) => dados.senha === dados.confirm, {
  message: "As senhas não coincidem",
  path: ["confirm"],
});
