import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido."),
  senha: z.string().min(1, "Informe a senha."),
});

export const resetSchema = z.object({
  email: z.string().email("E-mail inválido."),
});

export type LoginData = z.infer<typeof loginSchema>;
export type ResetData = z.infer<typeof resetSchema>;
