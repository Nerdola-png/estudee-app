-- Migration: Add gabarito preference to session filters and create obter_revisao RPC
-- Date: 2026-11-12

-- 1. Update iniciar_sessao RPC to accept mostrar_gabarito_agora parameter
-- and store it in the filtros JSONB

CREATE OR REPLACE FUNCTION public.iniciar_sessao(
    p_total_questoes integer,
    p_banca_ids integer[] DEFAULT NULL,
    p_materia_ids integer[] DEFAULT NULL,
    p_mostrar_gabarito_agora boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_sessao_id uuid;
    v_filtros jsonb := '{}'::jsonb;
    v_total_elegivel integer;
    v_questoes_ids uuid[];
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado.' USING ERRCODE = 'P0001';
    END IF;

    IF p_total_questoes <= 0 OR p_total_questoes > 100 THEN
        RAISE EXCEPTION 'Quantidade de questões inválida (1-100).' USING ERRCODE = 'P0002';
    END IF;

    -- Build filtros JSONB including the new preference
    v_filtros := jsonb_build_object(
        'banca_ids', COALESCE(p_banca_ids, '{}'::integer[]),
        'materia_ids', COALESCE(p_materia_ids, '{}'::integer[]),
        'mostrar_gabarito_agora', p_mostrar_gabarito_agora
    );

    -- Check eligible questions count
    SELECT COUNT(*) INTO v_total_elegivel
    FROM public.questoes q
    WHERE q.ativo = true
      AND (p_banca_ids IS NULL OR q.banca_id = ANY(p_banca_ids))
      AND (p_materia_ids IS NULL OR q.materia_id = ANY(p_materia_ids));

    IF v_total_elegivel < p_total_questoes THEN
        RAISE EXCEPTION 'Há apenas % questões elegíveis para esses filtros; reduza o tamanho do simulado.',
            v_total_elegivel USING ERRCODE = 'P0002';
    END IF;

    -- Create session
    INSERT INTO public.sessoes (user_id, modo, filtros, total_questoes, ultima_atividade_em)
    VALUES (v_user_id, 'simulado', v_filtros, p_total_questoes, clock_timestamp())
    RETURNING id INTO v_sessao_id;

    -- Select random questions for the session
    SELECT ARRAY_AGG(id) INTO v_questoes_ids
    FROM (
        SELECT id
        FROM public.questoes q
        WHERE q.ativo = true
          AND (p_banca_ids IS NULL OR q.banca_id = ANY(p_banca_ids))
          AND (p_materia_ids IS NULL OR q.materia_id = ANY(p_materia_ids))
        ORDER BY random()
        LIMIT p_total_questoes
    ) sub;

    -- Insert session questions
    INSERT INTO public.sessao_questoes (sessao_id, questao_id, ordem)
    SELECT v_sessao_id, qid, ROW_NUMBER() OVER ()
    FROM UNNEST(v_questoes_ids) AS qid;

    RETURN v_sessao_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.iniciar_sessao(integer, integer[], integer[], boolean) TO authenticated;

-- 2. Update responder_questao RPC to respect mostrar_gabarito_agora preference

DROP FUNCTION IF EXISTS public.responder_questao(uuid, uuid, text, integer);

CREATE OR REPLACE FUNCTION public.responder_questao(
    p_sessao_id uuid,
    p_questao_id uuid,
    p_resposta_usuario text,
    p_tempo_resposta_ms integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_sessao public.sessoes%rowtype;
    v_sessao_questao public.sessao_questoes%rowtype;
    v_questao public.questoes%rowtype;
    v_acertou boolean;
    v_anulada boolean := false;
    v_pontos numeric(14,2) := 0;
    v_ja_respondida boolean;
    v_mostrar_gabarito_agora boolean;
    v_resultado jsonb;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado.' USING ERRCODE = 'P0001';
    END IF;

    SELECT * INTO v_sessao
    FROM public.sessoes
    WHERE id = p_sessao_id AND user_id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sessão não encontrada.' USING ERRCODE = 'P0003';
    END IF;

    IF v_sessao.status <> 'em_andamento' THEN
        RAISE EXCEPTION 'Sessão não está em andamento.' USING ERRCODE = 'P0004';
    END IF;

    SELECT * INTO v_sessao_questao
    FROM public.sessao_questoes
    WHERE sessao_id = p_sessao_id AND questao_id = p_questao_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Questão não pertence a esta sessão.' USING ERRCODE = 'P0005';
    END IF;

    IF v_sessao_questao.respondida_em IS NOT NULL THEN
        v_ja_respondida := true;
    ELSE
        v_ja_respondida := false;
    END IF;

    SELECT * INTO v_questao
    FROM public.questoes
    WHERE id = p_questao_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Questão não encontrada.' USING ERRCODE = 'P0006';
    END IF;

    v_mostrar_gabarito_agora := COALESCE((v_sessao.filtros->>'mostrar_gabarito_agora')::boolean, true);

    v_acertou := (p_resposta_usuario = v_questao.alternativa_correta);
    v_anulada := (v_questao.gabarito_anulado = true);

    IF v_acertou AND NOT v_anulada THEN
        v_pontos := COALESCE(v_questao.peso_dificuldade, 1)::numeric(14,2);
    ELSIF v_anulada THEN
        v_pontos := COALESCE(v_questao.peso_dificuldade, 1)::numeric(14,2);
        v_acertou := true;
    ELSE
        v_pontos := 0;
    END IF;

    INSERT INTO public.respostas_simulado (
        sessao_id, questao_id, resposta_usuario, correta,
        tempo_resposta, pontos, respondida_em
    ) VALUES (
        p_sessao_id, p_questao_id, p_resposta_usuario, v_acertou,
        p_tempo_resposta_ms, v_pontos, clock_timestamp()
    )
    ON CONFLICT (sessao_id, questao_id) DO UPDATE SET
        resposta_usuario = EXCLUDED.resposta_usuario,
        correta = EXCLUDED.correta,
        tempo_resposta = EXCLUDED.tempo_resposta,
        pontos = EXCLUDED.pontos,
        respondida_em = EXCLUDED.respondida_em;

    UPDATE public.sessao_questoes
    SET respondida_em = clock_timestamp(),
        resposta_usuario = p_resposta_usuario,
        pontos = v_pontos
    WHERE sessao_id = p_sessao_id AND questao_id = p_questao_id;

    UPDATE public.sessoes
    SET ultima_atividade_em = clock_timestamp()
    WHERE id = p_sessao_id;

    IF v_mostrar_gabarito_agora THEN
        v_resultado := jsonb_build_object(
            'acertou', v_acertou,
            'anulada', v_anulada,
            'gabarito', v_questao.alternativa_correta,
            'justificativa', v_questao.comentario,
            'justificativa_alternativas', v_questao.justificativa_alternativas,
            'finalizada', false
        );
    ELSE
        v_resultado := jsonb_build_object(
            'acertou', v_acertou,
            'anulada', v_anulada,
            'finalizada', false
        );
    END IF;

    RETURN v_resultado;
END;
$$;

GRANT EXECUTE ON FUNCTION public.responder_questao(uuid, uuid, text, integer) TO authenticated;

-- 3. Create obter_revisao RPC for the review screen

CREATE OR REPLACE FUNCTION public.obter_revisao(
    p_sessao_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_sessao public.sessoes%rowtype;
    v_resultado jsonb;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado.' USING ERRCODE = 'P0001';
    END IF;

    SELECT * INTO v_sessao
    FROM public.sessoes
    WHERE id = p_sessao_id AND user_id = v_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sessão não encontrada.' USING ERRCODE = 'P0003';
    END IF;

    IF v_sessao.status <> 'finalizado' THEN
        RAISE EXCEPTION 'Sessão não foi finalizada.' USING ERRCODE = 'P0004';
    END IF;

    SELECT jsonb_build_object(
        'sessao_id', p_sessao_id,
        'questoes', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', sq.questao_id,
                'ordem', sq.ordem,
                'enunciado', q.enunciado,
                'texto_base', q.texto_base,
                'imagens', q.imagens,
                'alternativas', q.alternativas,
                'materia', m.nome,
                'anulada', q.gabarito_anulado,
                'resposta_usuario', rs.resposta_usuario,
                'gabarito', q.alternativa_correta,
                'justificativa', q.comentario,
                'justificativa_alternativas', q.justificativa_alternativas,
                'acertou', rs.correta
            ) ORDER BY sq.ordem)
            FROM public.sessao_questoes sq
            JOIN public.questoes q ON q.id = sq.questao_id
            JOIN public.materias m ON m.id = q.materia_id
            LEFT JOIN public.respostas_simulado rs ON rs.sessao_id = p_sessao_id AND rs.questao_id = sq.questao_id
            WHERE sq.sessao_id = p_sessao_id
        ), '[]'::jsonb)
    ) INTO v_resultado;

    RETURN v_resultado;
END;
$$;

GRANT EXECUTE ON FUNCTION public.obter_revisao(uuid) TO authenticated;