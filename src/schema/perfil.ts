import { z } from 'zod';

export const perfilSchema = z.object({
  nickname: z.string().trim().max(24, 'Use até 24 caracteres.').refine(
    (value) => value === '' || /^[A-Za-z0-9_]{3,24}$/.test(value),
    'Use de 3 a 24 letras, números ou sublinhados.',
  ),
  uf: z.string().refine(
    (value) => value === '' || /^[A-Z]{2}$/.test(value),
    'Selecione uma UF válida.',
  ),
  municipio_ibge: z.string().refine(
    (value) => value === '' || /^[0-9]{7}$/.test(value),
    'Selecione um município da lista.',
  ),
  ranking_opt_in: z.boolean(),
}).superRefine((data, context) => {
  if (data.ranking_opt_in && !data.nickname) {
    context.addIssue({
      code: 'custom',
      path: ['nickname'],
      message: 'Informe um nickname para aparecer no ranking.',
    });
  }
  if (data.ranking_opt_in && (!data.uf || !data.municipio_ibge)) {
    context.addIssue({
      code: 'custom',
      path: ['municipio_ibge'],
      message: 'Informe sua UF e município para participar do ranking.',
    });
  }
});

export type PerfilData = z.infer<typeof perfilSchema>;
