'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';

const alternativaSchema = z.object({
  key: z.string(),
  texto: z.string(),
});

const resultadoSchema = z.object({
  acertou: z.boolean(),
  anulada: z.boolean(),
  gabarito: z.string().nullable().optional(),
  justificativa: z.string().nullable().optional(),
  justificativa_alternativas: z.unknown().nullable().optional(),
});

const imagemSchema = z.object({
  path: z.string(),
  alt: z.string(),
});

const textoBaseSchema = z.object({
  titulo: z.string().nullable(),
  conteudo: z.string(),
  fonte: z.string().nullable(),
  imagens: z.array(imagemSchema).default([]),
});

const questaoSessaoSchema = z.object({
  id: z.string().uuid(),
  ordem: z.number().int(),
  enunciado: z.string(),
  texto_base: textoBaseSchema.nullable().optional(),
  imagens: z.array(imagemSchema).default([]),
  alternativas: z.array(alternativaSchema),
  materia: z.string(),
  anulada: z.boolean(),
  resposta: z.string().nullable(),
  resultado: resultadoSchema.nullable(),
});

const sessaoSchema = z.object({
  sessao_id: z.string().uuid(),
  status: z.enum(['em_andamento', 'finalizado', 'abandonado']),
  total_questoes: z.number().int(),
  acertos: z.number().int(),
  started_at: z.string(),
  tempo_ativo_segundos: z.number().int(),
  filtros: z.object({
    banca_ids: z.array(z.number()).optional(),
    materia_ids: z.array(z.number()).optional(),
    mostrar_gabarito_agora: z.boolean().optional(),
  }).optional().default({}),
  questoes: z.array(questaoSessaoSchema),
});

const novaSessaoSchema = z.object({
  sessao_id: z.string().uuid(),
  total_questoes: z.number().int(),
});

const respostaSchema = resultadoSchema.extend({
  finalizada: z.boolean(),
});

export type QuestaoSessao = z.infer<typeof questaoSessaoSchema>;
export type ResultadoResposta = z.infer<typeof respostaSchema>;

export function useOpcoesSimulado() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['opcoes-simulado'],
    queryFn: async () => {
      const [bancasResult, materiasResult] = await Promise.all([
        supabase.from('bancas').select('id,nome').order('nome'),
        supabase.from('materias').select('id,nome').order('nome'),
      ]);

      if (bancasResult.error) throw bancasResult.error;
      if (materiasResult.error) throw materiasResult.error;

      const [planoResult, planosResult] = await Promise.all([
        supabase.rpc('plano_atual_usuario'),
        supabase.from('planos_config').select('plano,tamanhos_permitidos,ranking_visivel'),
      ]);

      if (planoResult.error) throw planoResult.error;
      if (planosResult.error) throw planosResult.error;

      const planoAtual = planoResult.data;
      const planoAtualConfig = planosResult.data.find((item) => item.plano === planoAtual);
      const planoPremium = planosResult.data.find((item) => item.plano === 'premium');

      if (!planoAtualConfig || !planoPremium) {
        throw new Error('Configuração de planos indisponível.');
      }

      return {
        bancas: bancasResult.data,
        materias: materiasResult.data,
        plano: planoAtual,
        rankingVisivel: planoAtualConfig.ranking_visivel,
        tamanhosPermitidos: planoAtualConfig.tamanhos_permitidos,
        tamanhosPremium: planoPremium.tamanhos_permitidos,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useIniciarSessao() {
  const supabase = createClient();

  return useMutation({
    mutationFn: async (input: {
      totalQuestoes: number;
      bancaIds: number[];
      materiaIds: number[];
      mostrarGabaritoAgora?: boolean;
    }) => {
      const { data, error } = await supabase.rpc('iniciar_sessao', {
        p_total_questoes: input.totalQuestoes,
        p_banca_ids: input.bancaIds.length > 0 ? input.bancaIds : undefined,
        p_materia_ids: input.materiaIds.length > 0 ? input.materiaIds : undefined,
        p_mostrar_gabarito_agora: input.mostrarGabaritoAgora ?? true,
      });

      if (error) throw error;
      return novaSessaoSchema.parse(data);
    },
  });
}

export function useSessaoQuiz(sessaoId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['sessao-quiz', sessaoId],
    enabled: Boolean(sessaoId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('carregar_sessao', {
        p_sessao_id: sessaoId,
      });

      if (error) throw error;
      return sessaoSchema.parse(data);
    },
    refetchOnWindowFocus: false,
  });
}

export function useResponderQuestao(sessaoId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      questaoId: string;
      resposta: string;
      tempoAtivoSegundos: number;
    }) => {
      const { data, error } = await supabase.rpc('responder_questao', {
        p_sessao_id: sessaoId,
        p_questao_id: input.questaoId,
        p_resposta: input.resposta,
        p_tempo_ativo_segundos: input.tempoAtivoSegundos,
      });

      if (error) throw error;
      return respostaSchema.parse(data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sessao-quiz', sessaoId] });
    },
  });
}

export function useRegistrarTempoAtivo(sessaoId: string) {
  const supabase = createClient();

  return useMutation({
    mutationFn: async (tempoAtivoSegundos: number) => {
      const { data, error } = await supabase.rpc('registrar_tempo_ativo', {
        p_sessao_id: sessaoId,
        p_tempo_ativo_segundos: tempoAtivoSegundos,
      });

      if (error) throw error;
      return data;
    },
  });
}

export function useFinalizarSessao(sessaoId: string) {
  const supabase = createClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('finalizar_sessao', {
        p_sessao_id: sessaoId,
      });

      if (error) throw error;
      return data;
    },
  });
}

const rankingSchema = z.object({
  escopo: z.enum(['nacional', 'estadual', 'municipal']),
  periodo: z.enum(['geral', 'semanal', 'mensal']),
  ranking: z.array(z.object({
    posicao: z.number().int(),
    nickname: z.string().nullable(),
    pontos: z.number(),
  })),
  minha_posicao: z.object({
    escopo: z.string(),
    periodo: z.string(),
    posicao: z.number().int().nullable(),
    pontos: z.number().nullable(),
  }),
});

export type Ranking = z.infer<typeof rankingSchema>;

export function useRanking(
  escopo: 'nacional' | 'estadual' | 'municipal',
  periodo: 'geral' | 'semanal' | 'mensal',
  enabled = true,
) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['ranking', escopo, periodo],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('obter_ranking', {
        p_escopo: escopo,
        p_periodo: periodo,
      });

      if (error) throw error;
      return rankingSchema.parse(data);
    },
  });
}

const posicaoSchema = z.object({
  escopo: z.string(),
  periodo: z.string(),
  posicao: z.number().int().nullable(),
  pontos: z.number().nullable(),
});

export function useMinhaPosicao(
  escopo: 'nacional' | 'estadual' | 'municipal',
  periodo: 'geral' | 'semanal' | 'mensal',
  enabled = true,
) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['minha-posicao', escopo, periodo],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('obter_minha_posicao', {
        p_escopo: escopo,
        p_periodo: periodo,
      });

      if (error) throw error;
      return posicaoSchema.parse(data);
    },
  });
}

// Revisão schemas
const revisaoQuestaoSchema = z.object({
  id: z.string().uuid(),
  ordem: z.number().int(),
  enunciado: z.string(),
  texto_base: textoBaseSchema.nullable().optional(),
  imagens: z.array(imagemSchema).default([]),
  alternativas: z.array(alternativaSchema),
  materia: z.string(),
  anulada: z.boolean(),
  resposta_usuario: z.string().nullable(),
  gabarito: z.string(),
  justificativa: z.string().nullable(),
  justificativa_alternativas: z.unknown().nullable(),
  acertou: z.boolean().nullable(),
});

const revisaoSchema = z.object({
  sessao_id: z.string().uuid(),
  questoes: z.array(revisaoQuestaoSchema),
});

export type RevisaoQuestao = z.infer<typeof revisaoQuestaoSchema>;
export type RevisaoSessao = z.infer<typeof revisaoSchema>;

export function useRevisao(sessaoId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['revisao', sessaoId],
    enabled: Boolean(sessaoId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('obter_revisao', {
        p_sessao_id: sessaoId,
      });

      if (error) throw error;
      return revisaoSchema.parse(data);
    },
  });
}
