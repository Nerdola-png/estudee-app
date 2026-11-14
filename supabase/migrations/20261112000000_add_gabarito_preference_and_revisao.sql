-- Migration: preferência "mostrar gabarito agora" + tela de revisão
-- Date: 2026-11-12
--
-- Esta migration reescreve `responder_questao` a partir da versão pontuada
-- (20261107110000_add_scored_quiz_rpcs.sql) e acrescenta somente a preferência
-- `mostrar_gabarito_agora`.
--
-- Correções em relação à versão anterior deste arquivo:
--   * `responder_questao` usava colunas/tabelas inexistentes
--     (questoes.alternativa_correta, questoes.gabarito_anulado,
--     questoes.comentario e a tabela respostas_simulado) e perdia as regras de
--     pontuação das seções 4 e 5 do CLAUDE.md:
--       - pontos calculados no servidor por `calcular_pontos` (base, bônus de
--         tempo e multiplicador de sequência);
--       - tempo medido no servidor (`exibida_em` -> resposta), nunca o tempo do
--         navegador;
--       - anti-farm via `questoes_pontuadas` (só o primeiro acerto de cada
--         questão pontua no ranking);
--       - idempotência: responder de novo devolve o resultado já gravado e
--         trocar a resposta depois de ver o gabarito é bloqueado;
--   * `iniciar_sessao` valida novamente o tamanho do simulado contra
--     `planos_config` e as bancas/matérias informadas;
--   * `obter_revisao` usa as colunas reais (`questoes.gabarito`,
--     `questoes.justificativa`, `questoes.status_gabarito`,
--     `sessao_questoes.resposta`/`sessao_questoes.correta`) em vez das
--     inexistentes;
--   * `carregar_sessao` devolve `filtros` e respeita a preferência, para não
--     vazar gabarito/comentário de questões já respondidas.

-- 1. iniciar_sessao: mantém as regras da versão pontuada (plano, filtros,
--    questões elegíveis) e passa a receber a preferência do simulado.
--    A assinatura ganha um quarto parâmetro; a versão antiga é removida para
--    não deixar duas overloads ambíguas para o PostgREST.
DROP FUNCTION IF EXISTS public.iniciar_sessao(integer, smallint[], smallint[]);

CREATE OR REPLACE FUNCTION public.iniciar_sessao(
    p_total_questoes integer,
    p_banca_ids smallint[] DEFAULT NULL,
    p_materia_ids smallint[] DEFAULT NULL,
    p_mostrar_gabarito_agora boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_plano text;
    v_tamanhos integer[];
    v_sessao_id uuid;
    v_total_elegivel integer;
    v_total_inserido integer;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Autenticação necessária.' USING ERRCODE = '28000';
    END IF;

    v_plano := public.plano_atual_usuario();
    SELECT tamanhos_permitidos INTO v_tamanhos
    FROM public.planos_config
    WHERE plano = v_plano;

    IF p_total_questoes IS NULL OR NOT (p_total_questoes = ANY(v_tamanhos)) THEN
        RAISE EXCEPTION 'Esse tamanho de simulado não está disponível no seu plano.' USING ERRCODE = '22023';
    END IF;

    IF COALESCE(cardinality(p_banca_ids), 0) > 0 AND EXISTS (
        SELECT 1
        FROM unnest(p_banca_ids) AS banca_id
        WHERE NOT EXISTS (SELECT 1 FROM public.bancas WHERE id = banca_id)
    ) THEN
        RAISE EXCEPTION 'Uma ou mais bancas são inválidas.' USING ERRCODE = '22023';
    END IF;

    IF COALESCE(cardinality(p_materia_ids), 0) > 0 AND EXISTS (
        SELECT 1
        FROM unnest(p_materia_ids) AS materia_id
        WHERE NOT EXISTS (SELECT 1 FROM public.materias WHERE id = materia_id)
    ) THEN
        RAISE EXCEPTION 'Uma ou mais matérias são inválidas.' USING ERRCODE = '22023';
    END IF;
    SELECT COUNT(*) INTO v_total_elegivel
    FROM public.questoes AS q
    WHERE q.ativo
      AND (COALESCE(cardinality(p_banca_ids), 0) = 0 OR q.banca_id = ANY(p_banca_ids))
      AND (COALESCE(cardinality(p_materia_ids), 0) = 0 OR q.materia_id = ANY(p_materia_ids))
      AND (
        q.status_gabarito = 'anulada'
        OR EXISTS (
          SELECT 1
          FROM jsonb_array_elements(q.alternativas) AS alternativa
          WHERE upper(trim(COALESCE(alternativa->>'key', alternativa->>'letra'))) = upper(trim(q.gabarito))
        )
      );

    IF v_total_elegivel < p_total_questoes THEN
        RAISE EXCEPTION 'Há apenas % questões elegíveis para esses filtros; reduza o tamanho do simulado.',
            v_total_elegivel USING ERRCODE = 'P0002';
    END IF;

    INSERT INTO public.sessoes (user_id, modo, filtros, total_questoes, ultima_atividade_em)
    VALUES (
        v_user_id,
        'simulado',
        jsonb_build_object(
            'banca_ids', COALESCE(to_jsonb(p_banca_ids), '[]'::jsonb),
            'materia_ids', COALESCE(to_jsonb(p_materia_ids), '[]'::jsonb),
            'mostrar_gabarito_agora', COALESCE(p_mostrar_gabarito_agora, true)
        ),
        p_total_questoes,
        clock_timestamp()
    )
    RETURNING id INTO v_sessao_id;

    WITH candidatas AS (
        SELECT
            q.id,
            EXISTS (
                SELECT 1
                FROM public.questoes_pontuadas AS qp
                WHERE qp.user_id = v_user_id
                  AND qp.questao_id = q.id
            ) AS ja_pontuada,
            random() AS sorteio
        FROM public.questoes AS q
        WHERE q.ativo
          AND (COALESCE(cardinality(p_banca_ids), 0) = 0 OR q.banca_id = ANY(p_banca_ids))
          AND (COALESCE(cardinality(p_materia_ids), 0) = 0 OR q.materia_id = ANY(p_materia_ids))
          AND (
            q.status_gabarito = 'anulada'
            OR EXISTS (
              SELECT 1
              FROM jsonb_array_elements(q.alternativas) AS alternativa
              WHERE upper(trim(COALESCE(alternativa->>'key', alternativa->>'letra'))) = upper(trim(q.gabarito))
            )
          )
    ), selecionadas AS (
        SELECT
            id,
            row_number() OVER (ORDER BY ja_pontuada, sorteio)::smallint AS ordem
        FROM candidatas
        ORDER BY ja_pontuada, sorteio
        LIMIT p_total_questoes
    )
    INSERT INTO public.sessao_questoes (sessao_id, questao_id, ordem)
    SELECT v_sessao_id, selecionadas.id, selecionadas.ordem
    FROM selecionadas;

    GET DIAGNOSTICS v_total_inserido = ROW_COUNT;

    IF v_total_inserido <> p_total_questoes THEN
        RAISE EXCEPTION 'Não foi possível montar o simulado completo. Tente novamente.' USING ERRCODE = 'P0002';
    END IF;

    RETURN jsonb_build_object(
        'sessao_id', v_sessao_id,
        'total_questoes', v_total_inserido
    );
END;
$$;
-- 2. responder_questao: reescrita a partir da versão pontuada de 07/11,
--    preservando calcular_pontos, tempo medido no servidor, anti-farm e
--    idempotência, e acrescentando apenas a preferência mostrar_gabarito_agora.
--    A assinatura volta a ser (p_sessao_id, p_questao_id, p_resposta,
--    p_tempo_ativo_segundos): o tempo do cliente é informativo e nunca entra
--    na fórmula.
DROP FUNCTION IF EXISTS public.responder_questao(uuid, uuid, text, integer);

CREATE OR REPLACE FUNCTION public.responder_questao(
    p_sessao_id uuid,
    p_questao_id uuid,
    p_resposta text,
    p_tempo_ativo_segundos integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_sessao public.sessoes%rowtype;
    v_status_gabarito public.status_gabarito;
    v_resposta_existente character(1);
    v_resposta character(1);
    v_gabarito character(1);
    v_justificativa text;
    v_justificativa_alternativas jsonb;
    v_alternativas jsonb;
    v_exibida_em timestamptz;
    v_t_ref integer;
    v_peso integer;
    v_tempo_ms integer;
    v_tempo_valido boolean;
    v_acertou boolean;
    v_pontua_ranking boolean := false;
    v_sequencia smallint := 0;
    v_ultima_sequencia smallint;
    v_ultima_correta boolean;
    v_pontos_base numeric(12, 2);
    v_bonus_tempo numeric(6, 4);
    v_mult_sequencia numeric(4, 2);
    v_pontos numeric(14, 2);
    v_formula smallint := 1;
    v_linhas_inseridas integer;
    v_now timestamptz := clock_timestamp();
    v_mostrar_gabarito_agora boolean;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Autenticação necessária.' USING ERRCODE = '28000';
    END IF;

    IF p_resposta IS NULL OR LENGTH(TRIM(p_resposta)) <> 1 THEN
        RAISE EXCEPTION 'Informe uma única alternativa.' USING ERRCODE = '22023';
    END IF;

    IF p_tempo_ativo_segundos IS NOT NULL
        AND (p_tempo_ativo_segundos < 0 OR p_tempo_ativo_segundos > 2592000)
    THEN
        RAISE EXCEPTION 'Tempo ativo inválido.' USING ERRCODE = '22023';
    END IF;

    v_resposta := UPPER(TRIM(p_resposta))::character(1);

    SELECT * INTO v_sessao
    FROM public.sessoes
    WHERE id = p_sessao_id AND user_id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sessão não encontrada.' USING ERRCODE = 'P0002';
    END IF;

    -- Preferência do simulado: quando falsa, o gabarito e o comentário só
    -- aparecem na tela de revisão (obter_revisao).
    v_mostrar_gabarito_agora := COALESCE(
        (v_sessao.filtros->>'mostrar_gabarito_agora')::boolean,
        true
    );
    SELECT
        sq.resposta,
        sq.exibida_em,
        q.gabarito,
        q.justificativa,
        q.justificativa_alternativas,
        q.alternativas,
        q.status_gabarito,
        q.t_ref_segundos,
        q.peso_dificuldade
    INTO
        v_resposta_existente,
        v_exibida_em,
        v_gabarito,
        v_justificativa,
        v_justificativa_alternativas,
        v_alternativas,
        v_status_gabarito,
        v_t_ref,
        v_peso
    FROM public.sessao_questoes AS sq
    JOIN public.questoes AS q ON q.id = sq.questao_id
    WHERE sq.sessao_id = p_sessao_id AND sq.questao_id = p_questao_id
    FOR UPDATE OF sq;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Questão não pertence a esta sessão.' USING ERRCODE = '22023';
    END IF;

    -- Idempotência: reenviar a mesma resposta devolve o resultado já gravado,
    -- sem recalcular pontos; trocar a resposta é bloqueado, para não permitir
    -- responder de novo depois de ver o gabarito.
    IF v_resposta_existente IS NOT NULL THEN
        IF v_resposta_existente <> v_resposta THEN
            RAISE EXCEPTION 'Esta questão já foi respondida.' USING ERRCODE = '55000';
        END IF;

        IF v_mostrar_gabarito_agora THEN
            RETURN jsonb_build_object(
                'acertou', v_status_gabarito = 'anulada' OR UPPER(TRIM(v_resposta_existente)) = UPPER(TRIM(v_gabarito)),
                'anulada', v_status_gabarito = 'anulada',
                'gabarito', CASE WHEN v_status_gabarito = 'anulada' THEN NULL ELSE v_gabarito END,
                'justificativa', v_justificativa,
                'justificativa_alternativas', v_justificativa_alternativas,
                'finalizada', v_sessao.status = 'finalizado'
            );
        END IF;

        RETURN jsonb_build_object(
            'acertou', v_status_gabarito = 'anulada' OR UPPER(TRIM(v_resposta_existente)) = UPPER(TRIM(v_gabarito)),
            'anulada', v_status_gabarito = 'anulada',
            'finalizada', v_sessao.status = 'finalizado'
        );
    END IF;

    IF v_sessao.status <> 'em_andamento' THEN
        RAISE EXCEPTION 'A sessão não está em andamento.' USING ERRCODE = '55000';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(v_alternativas) AS alternativa
        WHERE UPPER(TRIM(COALESCE(alternativa->>'key', alternativa->>'letra'))) = v_resposta::text
    ) THEN
        RAISE EXCEPTION 'Alternativa inválida.' USING ERRCODE = '22023';
    END IF;

    IF v_exibida_em IS NULL THEN
        v_exibida_em := v_now;
    END IF;

    -- Tempo medido no servidor (exibida_em -> resposta). O tempo enviado pelo
    -- cliente é apenas informativo e nunca entra na fórmula.
    v_tempo_ms := LEAST(
        2147483647::numeric,
        GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (v_now - v_exibida_em)) * 1000))
    )::integer;
    v_tempo_valido := v_tempo_ms::bigint <= 3000::bigint * v_t_ref;
    v_acertou := v_status_gabarito = 'anulada'
        OR UPPER(TRIM(v_resposta)) = UPPER(TRIM(v_gabarito));

    IF v_acertou THEN
        SELECT sq.sequencia, sq.correta
        INTO v_ultima_sequencia, v_ultima_correta
        FROM public.sessao_questoes AS sq
        WHERE sq.sessao_id = p_sessao_id AND sq.respondida_em IS NOT NULL
        ORDER BY sq.respondida_em DESC, sq.ordem DESC
        LIMIT 1;

        v_sequencia := CASE
            WHEN COALESCE(v_ultima_correta, false) THEN COALESCE(v_ultima_sequencia, 0) + 1
            ELSE 1
        END;

        -- Anti-farm: só o primeiro acerto de cada questão pontua no ranking.
        INSERT INTO public.questoes_pontuadas (user_id, questao_id, primeira_sessao_id)
        VALUES (v_user_id, p_questao_id, p_sessao_id)
        ON CONFLICT (user_id, questao_id) DO NOTHING;
        GET DIAGNOSTICS v_linhas_inseridas = ROW_COUNT;
        v_pontua_ranking := v_linhas_inseridas = 1;
    END IF;

    SELECT
        p.pontos_base,
        p.bonus_tempo,
        p.mult_sequencia,
        p.pontos
    INTO
        v_pontos_base,
        v_bonus_tempo,
        v_mult_sequencia,
        v_pontos
    FROM public.calcular_pontos(
        v_acertou,
        v_peso,
        v_tempo_ms,
        v_t_ref,
        v_sequencia,
        v_formula
    ) AS p;

    IF NOT v_pontua_ranking THEN
        v_pontos_base := 0;
        v_pontos := 0;
    END IF;
    UPDATE public.sessao_questoes
    SET resposta = v_resposta,
        correta = v_acertou,
        respondida_at = v_now,
        respondida_em = v_now,
        tempo_servidor_ms = v_tempo_ms,
        tempo_valido = v_tempo_valido,
        tempo_ativo_segundos = COALESCE(p_tempo_ativo_segundos, tempo_ativo_segundos),
        sequencia = v_sequencia,
        pontos_base = v_pontos_base,
        bonus_tempo = v_bonus_tempo,
        mult_sequencia = v_mult_sequencia,
        pontos = v_pontos,
        pontua_ranking = v_pontua_ranking,
        formula_versao = v_formula
    WHERE sessao_id = p_sessao_id AND questao_id = p_questao_id;

    UPDATE public.sessoes
    SET acertos = (
            SELECT COUNT(*)::smallint
            FROM public.sessao_questoes
            WHERE sessao_id = p_sessao_id AND correta IS TRUE
        ),
        pontos_total = (
            SELECT COALESCE(SUM(pontos), 0)
            FROM public.sessao_questoes
            WHERE sessao_id = p_sessao_id
        ),
        tempo_ativo_segundos = GREATEST(
            tempo_ativo_segundos,
            COALESCE(p_tempo_ativo_segundos, 0)
        ),
        ultima_atividade_em = v_now
    WHERE id = p_sessao_id;

    IF v_mostrar_gabarito_agora THEN
        RETURN jsonb_build_object(
            'acertou', v_acertou,
            'anulada', v_status_gabarito = 'anulada',
            'gabarito', CASE WHEN v_status_gabarito = 'anulada' THEN NULL ELSE v_gabarito END,
            'justificativa', v_justificativa,
            'justificativa_alternativas', v_justificativa_alternativas,
            'finalizada', false
        );
    END IF;

    RETURN jsonb_build_object(
        'acertou', v_acertou,
        'anulada', v_status_gabarito = 'anulada',
        'finalizada', false
    );
END;
$$;
-- 3. carregar_sessao: devolve os filtros da sessão (com a preferência) e não
--    expõe gabarito/comentário de questões já respondidas quando a preferência
--    estiver desligada.
CREATE OR REPLACE FUNCTION public.carregar_sessao(
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
    v_questoes jsonb;
    v_mostrar_gabarito_agora boolean;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Autenticação necessária.' USING ERRCODE = '28000';
    END IF;

    SELECT * INTO v_sessao
    FROM public.sessoes
    WHERE id = p_sessao_id AND user_id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sessão não encontrada.' USING ERRCODE = 'P0002';
    END IF;

    v_mostrar_gabarito_agora := COALESCE(
        (v_sessao.filtros->>'mostrar_gabarito_agora')::boolean,
        true
    );

    IF v_sessao.status = 'em_andamento' THEN
        UPDATE public.sessoes
        SET ultima_atividade_em = clock_timestamp()
        WHERE id = p_sessao_id;

        UPDATE public.sessao_questoes
        SET exibida_em = clock_timestamp()
        WHERE sessao_id = p_sessao_id
          AND questao_id = (
            SELECT questao_id
            FROM public.sessao_questoes
            WHERE sessao_id = p_sessao_id AND resposta IS NULL
            ORDER BY ordem
            LIMIT 1
          );
    END IF;

    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', q.id,
                'ordem', sq.ordem,
                'enunciado', q.enunciado,
                'imagens', q.imagens,
                'texto_base', CASE
                    WHEN tb.id IS NULL THEN NULL
                    ELSE jsonb_build_object(
                        'titulo', tb.titulo,
                        'conteudo', tb.conteudo,
                        'fonte', tb.fonte,
                        'imagens', tb.imagens
                    )
                END,
                'alternativas', q.alternativas,
                'materia', m.nome,
                'anulada', q.status_gabarito = 'anulada',
                'resposta', sq.resposta,
                'resultado', CASE
                    WHEN sq.resposta IS NULL THEN NULL
                    WHEN NOT v_mostrar_gabarito_agora THEN jsonb_build_object(
                        'acertou', sq.correta,
                        'anulada', q.status_gabarito = 'anulada'
                    )
                    ELSE jsonb_build_object(
                        'acertou', sq.correta,
                        'anulada', q.status_gabarito = 'anulada',
                        'gabarito', CASE WHEN q.status_gabarito = 'anulada' THEN NULL ELSE q.gabarito END,
                        'justificativa', q.justificativa,
                        'justificativa_alternativas', q.justificativa_alternativas
                    )
                END
            ) ORDER BY sq.ordem
        ),
        '[]'::jsonb
    ) INTO v_questoes
    FROM public.sessao_questoes AS sq
    JOIN public.questoes AS q ON q.id = sq.questao_id
    JOIN public.materias AS m ON m.id = q.materia_id
    LEFT JOIN public.textos_base AS tb ON tb.id = q.texto_base_id
    WHERE sq.sessao_id = p_sessao_id;

    RETURN jsonb_build_object(
        'sessao_id', v_sessao.id,
        'status', v_sessao.status,
        'total_questoes', v_sessao.total_questoes,
        'acertos', COALESCE(v_sessao.acertos, 0),
        'started_at', v_sessao.started_at,
        'tempo_ativo_segundos', v_sessao.tempo_ativo_segundos,
        'filtros', v_sessao.filtros,
        'questoes', v_questoes
    );
END;
$$;
-- 4. obter_revisao: tela de revisão com o gabarito completo. Usa as colunas
--    reais: questoes.gabarito, questoes.justificativa,
--    questoes.justificativa_alternativas, questoes.status_gabarito e
--    sessao_questoes.resposta / sessao_questoes.correta.
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
        RAISE EXCEPTION 'Autenticação necessária.' USING ERRCODE = '28000';
    END IF;

    SELECT * INTO v_sessao
    FROM public.sessoes
    WHERE id = p_sessao_id AND user_id = v_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sessão não encontrada.' USING ERRCODE = 'P0002';
    END IF;

    IF v_sessao.status <> 'finalizado' THEN
        RAISE EXCEPTION 'A sessão não foi finalizada.' USING ERRCODE = 'P0002';
    END IF;

    SELECT jsonb_build_object(
        'sessao_id', p_sessao_id,
        'questoes', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', sq.questao_id,
                'ordem', sq.ordem,
                'enunciado', q.enunciado,
                'imagens', q.imagens,
                'texto_base', CASE
                    WHEN tb.id IS NULL THEN NULL
                    ELSE jsonb_build_object(
                        'titulo', tb.titulo,
                        'conteudo', tb.conteudo,
                        'fonte', tb.fonte,
                        'imagens', tb.imagens
                    )
                END,
                'alternativas', q.alternativas,
                'materia', m.nome,
                'anulada', q.status_gabarito = 'anulada',
                'resposta_usuario', sq.resposta,
                'gabarito', CASE WHEN q.status_gabarito = 'anulada' THEN NULL ELSE q.gabarito END,
                'justificativa', q.justificativa,
                'justificativa_alternativas', q.justificativa_alternativas,
                'acertou', sq.correta
            ) ORDER BY sq.ordem)
            FROM public.sessao_questoes AS sq
            JOIN public.questoes AS q ON q.id = sq.questao_id
            JOIN public.materias AS m ON m.id = q.materia_id
            LEFT JOIN public.textos_base AS tb ON tb.id = q.texto_base_id
            WHERE sq.sessao_id = p_sessao_id
        ), '[]'::jsonb)
    ) INTO v_resultado;

    RETURN v_resultado;
END;
$$;

-- 5. Grants: nada disso pode ser executado por anon/public.
REVOKE ALL ON FUNCTION public.iniciar_sessao(integer, smallint[], smallint[], boolean) FROM public, anon;
REVOKE ALL ON FUNCTION public.responder_questao(uuid, uuid, text, integer) FROM public, anon;
REVOKE ALL ON FUNCTION public.carregar_sessao(uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.obter_revisao(uuid) FROM public, anon;

GRANT EXECUTE ON FUNCTION public.iniciar_sessao(integer, smallint[], smallint[], boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.responder_questao(uuid, uuid, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.carregar_sessao(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.obter_revisao(uuid) TO authenticated;