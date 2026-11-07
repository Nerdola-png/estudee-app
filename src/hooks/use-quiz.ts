'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';

const alternativaSchema = z.object({
  letra: z.string(),
  texto: z.string(),
});

const resultadoSchema = z.object({
  acertou: z.boolean(),
  gabarito: z.string(),
  justificativa: z.string().nullable(),
  justificativa_alternativas: z.unknown().nullable(),
});

const questaoSessaoSchema = z.object({
  id: z.string().uuid(),
  ordem: z.number().int(),
  enunciado: z.string(),
  alternativas: z.array(alternativaSchema),
  materia: z.string(),
  resposta: z.string().nullable(),
  resultado: resultadoSchema.nullable(),
});

const sessaoSchema = z.object({
  sessao_id: z.string().uuid(),
  status: z.enum(['em_andamento', 'finalizado', 'abandonado']),
  total_questoes: z.number().int(),
  acertos: z.number().int(),
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

      return {
        bancas: bancasResult.data,
        materias: materiasResult.data,
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
      bancaId: number | null;
      materiaId: number | null;
    }) => {
      const { data, error } = await supabase.rpc('iniciar_sessao', {
        p_total_questoes: input.totalQuestoes,
        p_banca_id: input.bancaId ?? undefined,
        p_materia_id: input.materiaId ?? undefined,
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
    mutationFn: async (input: { questaoId: string; resposta: string }) => {
      const { data, error } = await supabase.rpc('responder_questao', {
        p_sessao_id: sessaoId,
        p_questao_id: input.questaoId,
        p_resposta: input.resposta,
      });

      if (error) throw error;
      return respostaSchema.parse(data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sessao-quiz', sessaoId] });
    },
  });
}
