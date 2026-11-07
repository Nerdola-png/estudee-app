import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido."),
  senha: z.string().min(1, "Informe a senha."),
});

export const resetSchema = z.object({
  email: z.string().email("E-mail inválido."),
});

export const updatePasswordSchema = z
  .object({
    senha: z.string().min(8, "Mínimo 8 caracteres."),
    confirmarSenha: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    message: "As senhas não coincidem.",
    path: ["confirmarSenha"],
  });

export type LoginData = z.infer<typeof loginSchema>;
export type ResetData = z.infer<typeof resetSchema>;
export type UpdatePasswordData = z.infer<typeof updatePasswordSchema>;
