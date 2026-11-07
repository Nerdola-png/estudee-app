import { z } from 'zod';

export const estatisticasSchema = z.object({
  resumo: z.object({
    sessoes: z.number().int(),
    questoes: z.number().int(),
    acertos: z.number().int(),
    pontos_total: z.number(),
    tempo_ativo_segundos: z.number().int(),
    percentual: z.number(),
  }),
  materias: z.array(z.object({
    materia: z.string(),
    questoes: z.number().int(),
    acertos: z.number().int(),
    percentual: z.number(),
    pontos: z.number(),
    tempo_medio_segundos: z.number(),
  })),
  sessoes_recentes: z.array(z.object({
    sessao_id: z.string().uuid(),
    finalizada_em: z.string().nullable(),
    total_questoes: z.number().int(),
    acertos: z.number().int(),
    pontos: z.number(),
  })),
});

export type Estatisticas = z.infer<typeof estatisticasSchema>;
