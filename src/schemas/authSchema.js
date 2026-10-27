export const loginSchema = z.object({
  identificador: z.string().trim().min(1, "Informe seu e-mail ou usuário."),
  senha: z.string().min(6, "Informe sua senha."),
});

