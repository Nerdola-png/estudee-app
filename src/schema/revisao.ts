import { z } from 'zod';

const alternativaSchema = z.object({
  key: z.string(),
  texto: z.string(),
});

const textoBaseSchema = z.object({
  titulo: z.string().nullable(),
  conteudo: z.string(),
  fonte: z.string().nullable(),
  imagens: z.array(z.object({
    path: z.string(),
    alt: z.string(),
  })).default([]),
});

export const revisaoSchema = z.object({
  sessao_id: z.string().uuid(),
  questoes: z.array(z.object({
    id: z.string().uuid(),
    ordem: z.number().int(),
    enunciado: z.string(),
    texto_base: textoBaseSchema.nullable().optional(),
    imagens: z.array(z.object({
      path: z.string(),
      alt: z.string(),
    })).default([]),
    alternativas: z.array(alternativaSchema),
    materia: z.string(),
    banca: z.string().nullable(),
    ano: z.number().int().nullable(),
    cargo: z.string().nullable(),
    estado_prova: z.string().nullable(),
    anulada: z.boolean(),
    resposta_usuario: z.string().nullable(),
    gabarito: z.string().nullable(),
    justificativa: z.string().nullable(),
    justificativa_alternativas: z.unknown().nullable().optional(),
    acertou: z.boolean().nullable(),
  })),
});

export type RevisaoSessao = z.infer<typeof revisaoSchema>;
