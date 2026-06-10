import { z } from "zod";

export const cadastroSchema = z
  .object({
    nome: z.string().min(1, "Informe seu nome."),
    sobrenome: z.string().min(1, "Informe seu sobrenome."),
    email: z.string().email("E-mail inválido."),
    senha: z.string().min(8, "Mínimo 8 caracteres."),
    confirmarSenha: z.string(),
    cidade: z.string().min(1, "Informe sua cidade."),
    estado: z.string().min(2, "Selecione seu estado."),
    telefone: z.string().optional(),
    concurso_alvo: z.string().optional(),
  })
  .refine((d) => d.senha === d.confirmarSenha, {
    message: "As senhas não coincidem.",
    path: ["confirmarSenha"],
  });

export type CadastroData = z.infer<typeof cadastroSchema>;
