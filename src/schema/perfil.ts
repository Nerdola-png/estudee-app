import { z } from 'zod';

// --- Sub-schemas para validações específicas ---

// Validação de código OTP para e-mail
export const otpCodeSchema = z.object({
  codigoOtp: z.string().length(6, 'O código deve ter 6 dígitos.'),
});

// Validação de código SMS para telefone
export const smsCodeSchema = z.object({
  codigoSms: z.string().length(6, 'O código deve ter 6 dígitos.'),
});

// Schema principal do perfil
export const perfilSchema = z.object({
  // Dados pessoais
  telefone: z.string().refine(
    (value) => value === '' || /^(\d{10,11})$/.test(value.replace(/\D/g, '')),
    'Informe um telefone válido com DDD (10 ou 11 dígitos).',
  ),
  concurso_alvo: z.string().trim().max(100, 'Use até 100 caracteres.'),

  // Ranking (já existentes)
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
export type OtpCodeData = z.infer<typeof otpCodeSchema>;
export type SmsCodeData = z.infer<typeof smsCodeSchema>;

// Lista de concursos comuns para sugestões
export const CONCURSOS_COMUNS = [
  'Concursos Federais',
  'Concursos Estaduais',
  'Concursos Municipais',
  'Vestibulares',
  'OAB',
  'Enem',
  'Fuvest',
  'Unicamp',
  'ITA',
  'IME',
  'Banco do Brasil',
  'Caixa Econômica',
  'BNDES',
  'IBAMA',
  'ICMBio',
  'PF',
  'PRF',
  'Receita Federal',
  'Fiscal Tributário',
  'Magistério',
  'Saúde',
  'TI',
  'Outro',
];
