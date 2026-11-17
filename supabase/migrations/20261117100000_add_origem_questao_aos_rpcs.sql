-- Migration: adiciona origem da questão (banca, ano, cargo, estado) aos payloads das RPCs
-- Date: 2026-11-17
-- Carregar_sessao, obter_revisao e obter_resultado passam a expor os campos de origem
-- de cada questão para que as telas /estudar, /revisao e /resultado identifiquem
-- banca, ano, cargo e estado da prova.

-- 1. carregar_sessao: acrescenta banca, ano, cargo e estado_prova por questão
DROP FUNCTION IF EXISTS public.carregar_sessao(uuid);

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
                'banca', b.nome,
                'ano', q.ano,
                'cargo', c.nome,
                'estado_prova', q.estado_prova,
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
    LEFT JOIN public.bancas AS b ON b.id = q.banca_id
    LEFT JOIN public.cargos AS c ON c.id = q.cargo_id
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

-- 2. obter_revisao: acrescenta banca, ano, cargo e estado_prova por questão
DROP FUNCTION IF EXISTS public.obter_revisao(uuid);

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
                'banca', b.nome,
                'ano', q.ano,
                'cargo', c.nome,
                'estado_prova', q.estado_prova,
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
            LEFT JOIN public.bancas AS b ON b.id = q.banca_id
            LEFT JOIN public.cargos AS c ON c.id = q.cargo_id
            LEFT JOIN public.textos_base AS tb ON tb.id = q.texto_base_id
            WHERE sq.sessao_id = p_sessao_id
        ), '[]'::jsonb)
    ) INTO v_resultado;

    RETURN v_resultado;
END;
$$;

-- 3. obter_resultado: acrescenta lista de questões com origem para exibição question by question
DROP FUNCTION IF EXISTS public.obter_resultado(uuid);

CREATE OR REPLACE FUNCTION public.obter_resultado(
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
    v_materias jsonb;
    v_questoes_respondidas integer;
    v_tempo_medio numeric;
    v_questoes jsonb;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Autenticação necessária.' USING ERRCODE = '28000';
    END IF;

    SELECT * INTO v_sessao
    FROM public.sessoes
    WHERE id = p_sessao_id AND user_id = v_user_id AND status = 'finalizado';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Resultado não disponível para esta sessão.' USING ERRCODE = 'P0002';
    END IF;

    SELECT count(*)::integer, coalesce(avg(tempo_servidor_ms), 0)
    INTO v_questoes_respondidas, v_tempo_medio
    FROM public.sessao_questoes
    WHERE sessao_id = p_sessao_id AND resposta IS NOT NULL;

    SELECT coalesce(
        jsonb_agg(
            jsonb_build_object(
                'materia', dados.materia,
                'acertos', dados.acertos,
                'total', dados.total,
                'percentual', round(100.0 * dados.acertos / nullif(dados.total, 0)),
                'tempo_medio_segundos', round(dados.tempo_medio_ms / 1000.0, 1)
            )
            order by 100.0 * dados.acertos / nullif(dados.total, 0), dados.materia
        ),
        '[]'::jsonb
    ) INTO v_materias
    FROM (
        select
          m.nome as materia,
          count(*) filter (where sq.correta is true)::integer as acertos,
          count(*)::integer as total,
          coalesce(avg(sq.tempo_servidor_ms), 0) as tempo_medio_ms
        from public.sessao_questoes as sq
        join public.questoes as q on q.id = sq.questao_id
        join public.materias as m on m.id = q.materia_id
        where sq.sessao_id = p_sessao_id and sq.resposta is not null
        group by m.id, m.nome
    ) as dados;

    SELECT coalesce((
        SELECT jsonb_agg(jsonb_build_object(
            'id', q.id,
            'ordem', sq.ordem,
            'enunciado', q.enunciado,
            'materia', m.nome,
            'banca', b.nome,
            'ano', q.ano,
            'cargo', c.nome,
            'estado_prova', q.estado_prova,
            'anulada', q.status_gabarito = 'anulada',
            'resposta_usuario', sq.resposta,
            'acertou', sq.correta,
            'gabarito', CASE WHEN q.status_gabarito = 'anulada' THEN NULL ELSE q.gabarito END,
            'justificativa', q.justificativa
        ) ORDER BY sq.ordem)
        FROM public.sessao_questoes AS sq
        JOIN public.questoes AS q ON q.id = sq.questao_id
        JOIN public.materias AS m ON m.id = q.materia_id
        LEFT JOIN public.bancas AS b ON b.id = q.banca_id
        LEFT JOIN public.cargos AS c ON c.id = q.cargo_id
        WHERE sq.sessao_id = p_sessao_id AND sq.resposta IS NOT NULL
    ), '[]'::jsonb) INTO v_questoes;

    RETURN jsonb_build_object(
        'sessao_id', v_sessao.id,
        'status', v_sessao.status,
        'total_questoes', v_sessao.total_questoes,
        'questoes_respondidas', v_questoes_respondidas,
        'acertos', coalesce(v_sessao.acertos, 0),
        'pontos_total', v_sessao.pontos_total,
        'media_pontos_por_questao', round(v_sessao.pontos_total / nullif(v_sessao.total_questoes, 0), 2),
        'tempo_ativo_segundos', v_sessao.tempo_ativo_segundos,
        'tempo_medio_questao_segundos', round(v_tempo_medio / 1000.0, 1),
        'materias', v_materias,
        'questoes', v_questoes
    );
END;
$$;

-- 4. Grants: apenas authenticated executa; anon recebe 42501
REVOKE ALL ON FUNCTION public.carregar_sessao(uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.obter_revisao(uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.obter_resultado(uuid) FROM public, anon;

GRANT EXECUTE ON FUNCTION public.carregar_sessao(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.obter_revisao(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.obter_resultado(uuid) TO authenticated;