-- Testes das RPCs do simulado: pontuação no servidor, idempotência, anti-farm,
-- preferência "mostrar gabarito agora" e revisão.
--
-- Executar com:
--   npx supabase db query --file supabase/tests/responder_questao_scoring.sql
--
-- O script cria um usuário de teste com uma sessão real e valida o
-- comportamento de ponta a ponta das RPCs. Tudo roda dentro de um bloco DO,
-- que ao final remove os dados criados, então o banco de dados não é
-- alterado.

DO $$
DECLARE
    v_user_id uuid := gen_random_uuid();
    v_banca_id smallint;
    v_materia_id smallint;
    v_questao_id uuid;
    v_questao_2_id uuid;
    v_sessao_id uuid;
    v_sessao_2_id uuid;
    v_resultado jsonb;
    v_resultado_retry jsonb;
    v_pontos numeric;
    v_pontos_base numeric(12, 2);
    v_bonus_tempo numeric(6, 4);
    v_mult_sequencia numeric(4, 2);
    v_sequencia smallint;
    v_pontua_ranking boolean;
    v_tempo_servidor_ms integer;
    v_formula_versao smallint;
BEGIN
    ---------------------------------------------------------------------------
    -- Cenario: usuario autenticado, uma banca, uma materia e duas questoes.
    ---------------------------------------------------------------------------
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, aud, role)
    VALUES (v_user_id, 'teste-responder@example.com', '', now(), 'authenticated', 'authenticated');

    INSERT INTO public.profiles (id, nome, sobrenome, cidade, estado)
    VALUES (v_user_id, 'Teste', 'Responder', 'Recife', 'PE');

    INSERT INTO public.bancas (nome, slug) VALUES ('Banca Teste', 'banca-teste-responder') RETURNING id INTO v_banca_id;
    INSERT INTO public.materias (nome, slug) VALUES ('Matéria Teste', 'materia-teste-responder') RETURNING id INTO v_materia_id;

    INSERT INTO public.questoes (
        codigo, foco, tipo, banca_id, materia_id, estado_prova, ano,
        enunciado, alternativas, gabarito, justificativa,
        justificativa_alternativas, ativo, status_gabarito,
        peso_dificuldade, t_ref_segundos
    ) VALUES (
        'TESTE-RESPONDER-1', 'concurso', 'multipla_escolha', v_banca_id, v_materia_id,
        'PE', 2026, 'Questão de teste 1',
        '[{"key":"A","texto":"Alternativa A"},{"key":"B","texto":"Alternativa B"},{"key":"C","texto":"Alternativa C"}]'::jsonb,
        'B', 'Comentário da questão 1',
        '{"B":"Porque a alternativa B está correta."}'::jsonb, true, 'definitivo', 2, 60
    ) RETURNING id INTO v_questao_id;

    INSERT INTO public.questoes (
        codigo, foco, tipo, banca_id, materia_id, estado_prova, ano,
        enunciado, alternativas, gabarito, justificativa,
        justificativa_alternativas, ativo, status_gabarito,
        peso_dificuldade, t_ref_segundos
    ) VALUES (
        'TESTE-RESPONDER-2', 'concurso', 'multipla_escolha', v_banca_id, v_materia_id,
        'PE', 2026, 'Questão de teste 2',
        '[{"key":"A","texto":"Alternativa A"},{"key":"B","texto":"Alternativa B"}]'::jsonb,
        'A', 'Comentário da questão 2',
        NULL, true, 'definitivo', 1, 60
    ) RETURNING id INTO v_questao_2_id;

    -- Simula o login do usuario: as RPCs leem auth.uid() do JWT.
    PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user_id, 'role', 'authenticated')::text, true);
    PERFORM set_config('request.jwt.claim.sub', v_user_id::text, true);

    -- O plano gratuito permite simulados de 10 a 40 questoes, entao sao
    -- criadas questoes extras para completar o tamanho minimo.
    INSERT INTO public.questoes (
        codigo, foco, tipo, banca_id, materia_id, estado_prova, ano,
        enunciado, alternativas, gabarito, justificativa,
        justificativa_alternativas, ativo, status_gabarito,
        peso_dificuldade, t_ref_segundos
    )
    SELECT
        'TESTE-RESPONDER-FILLER-' || n,
        'concurso',
        'multipla_escolha',
        v_banca_id,
        v_materia_id,
        'PE',
        2026,
        'Questão de preenchimento ' || n,
        '[{"key":"A","texto":"Alternativa A"},{"key":"B","texto":"Alternativa B"}]'::jsonb,
        'A',
        'Comentário de preenchimento',
        NULL,
        true,
        'definitivo',
        1,
        60
    FROM generate_series(1, 8) AS n;

    ---------------------------------------------------------------------------
    -- 1. iniciar_sessao valida o plano e guarda a preferencia.
    ---------------------------------------------------------------------------
    BEGIN
        PERFORM public.iniciar_sessao(15);
        RAISE EXCEPTION 'iniciar_sessao deveria rejeitar tamanho fora do plano';
    EXCEPTION
        WHEN SQLSTATE '22023' THEN NULL;
    END;

    v_sessao_id := (public.iniciar_sessao(10, NULL, NULL, true) ->> 'sessao_id')::uuid;

    IF v_sessao_id IS NULL THEN
        RAISE EXCEPTION 'iniciar_sessao nao devolveu sessao_id';
    END IF;

    IF (SELECT filtros->>'mostrar_gabarito_agora' FROM public.sessoes WHERE id = v_sessao_id) <> 'true' THEN
        RAISE EXCEPTION 'iniciar_sessao nao guardou a preferencia mostrar_gabarito_agora';
    END IF;

    IF (SELECT COUNT(*) FROM public.sessao_questoes WHERE sessao_id = v_sessao_id) <> 10 THEN
        RAISE EXCEPTION 'iniciar_sessao nao montou as 10 questoes do simulado';
    END IF;

    -- A seleção é aleatória: força as duas questões de teste para dentro da
    -- sessão, para que os cenários de pontuação sejam determinísticos.
    DELETE FROM public.sessao_questoes
    WHERE sessao_id = v_sessao_id AND questao_id NOT IN (v_questao_id, v_questao_2_id);

    INSERT INTO public.sessao_questoes (sessao_id, questao_id, ordem)
    VALUES (v_sessao_id, v_questao_id, 1), (v_sessao_id, v_questao_2_id, 2)
    ON CONFLICT (sessao_id, questao_id) DO UPDATE SET ordem = EXCLUDED.ordem;
    ---------------------------------------------------------------------------
    -- 2. responder_questao calcula os pontos no servidor (base, bonus de tempo
    --    e multiplicador de sequencia) e devolve o gabarito.
    ---------------------------------------------------------------------------
    v_resultado := public.responder_questao(v_sessao_id, v_questao_id, 'B', 30);

    IF (v_resultado ->> 'acertou')::boolean IS DISTINCT FROM true THEN
        RAISE EXCEPTION 'Acertou deveria ser verdadeiro: %', v_resultado;
    END IF;

    IF (v_resultado ->> 'gabarito') IS DISTINCT FROM 'B' THEN
        RAISE EXCEPTION 'Gabarito deveria ser B: %', v_resultado;
    END IF;

    IF (v_resultado ->> 'justificativa') IS DISTINCT FROM 'Comentário da questão 1' THEN
        RAISE EXCEPTION 'Justificativa deveria ser devolvida: %', v_resultado;
    END IF;

    IF (v_resultado ->> 'finalizada')::boolean IS DISTINCT FROM false THEN
        RAISE EXCEPTION 'finalizada deveria ser false durante o simulado: %', v_resultado;
    END IF;

    SELECT pontos_base, bonus_tempo, mult_sequencia, pontos, sequencia,
           pontua_ranking, tempo_servidor_ms, formula_versao
    INTO v_pontos_base, v_bonus_tempo, v_mult_sequencia, v_pontos, v_sequencia,
           v_pontua_ranking, v_tempo_servidor_ms, v_formula_versao
    FROM public.sessao_questoes
    WHERE sessao_id = v_sessao_id AND questao_id = v_questao_id;

    IF v_pontos_base <> 200 THEN
        RAISE EXCEPTION 'pontos_base deveria ser 100 * peso(2) = 200, veio %', v_pontos_base;
    END IF;

    IF v_bonus_tempo < 0 OR v_bonus_tempo > 0.1 THEN
        RAISE EXCEPTION 'bonus_tempo deveria estar entre 0 e 0.1, veio %', v_bonus_tempo;
    END IF;

    IF v_mult_sequencia <> 1 THEN
        RAISE EXCEPTION 'mult_sequencia da primeira questao deveria ser 1, veio %', v_mult_sequencia;
    END IF;

    IF v_sequencia <> 1 THEN
        RAISE EXCEPTION 'sequencia da primeira questao deveria ser 1, veio %', v_sequencia;
    END IF;

    IF v_pontua_ranking IS DISTINCT FROM true THEN
        RAISE EXCEPTION 'primeiro acerto da questão deveria pontuar no ranking';
    END IF;

    IF v_formula_versao <> 1 THEN
        RAISE EXCEPTION 'formula_versao deveria ser 1, veio %', v_formula_versao;
    END IF;

    IF v_tempo_servidor_ms IS NULL OR v_tempo_servidor_ms < 0 THEN
        RAISE EXCEPTION 'tempo_servidor_ms deveria ser medido no servidor, veio %', v_tempo_servidor_ms;
    END IF;

    -- O tempo do cliente nao pode entrar na formula: os pontos devem bater com
    -- o que calcular_pontos produz usando o tempo medido no servidor.
    IF v_pontos <> round(200 * (1 + v_bonus_tempo) * v_mult_sequencia, 2) THEN
        RAISE EXCEPTION 'pontos % nao batem com a formula da secao 4 do CLAUDE.md', v_pontos;
    END IF;

    ---------------------------------------------------------------------------
    -- 3. Idempotencia: reenviar a mesma resposta devolve o resultado ja
    --    gravado, sem recalcular nem duplicar pontos.
    ---------------------------------------------------------------------------
    v_resultado_retry := public.responder_questao(v_sessao_id, v_questao_id, 'B', 30);

    IF (v_resultado_retry ->> 'acertou')::boolean IS DISTINCT FROM true
       OR (v_resultado_retry ->> 'gabarito') IS DISTINCT FROM 'B' THEN
        RAISE EXCEPTION 'retry deveria devolver o resultado ja gravado: %', v_resultado_retry;
    END IF;

    IF (SELECT pontos FROM public.sessao_questoes
        WHERE sessao_id = v_sessao_id AND questao_id = v_questao_id) <> v_pontos THEN
        RAISE EXCEPTION 'retry nao pode alterar os pontos ja gravados';
    END IF;

    IF (SELECT COUNT(*) FROM public.sessao_questoes
        WHERE sessao_id = v_sessao_id AND questao_id = v_questao_id) <> 1 THEN
        RAISE EXCEPTION 'retry nao pode duplicar a resposta';
    END IF;

    IF (SELECT pontos_total FROM public.sessoes WHERE id = v_sessao_id) <> v_pontos THEN
        RAISE EXCEPTION 'retry nao pode alterar o total de pontos da sessao';
    END IF;

    ---------------------------------------------------------------------------
    -- 4. Trocar a resposta depois de ver o gabarito e bloqueado.
    ---------------------------------------------------------------------------
    BEGIN
        PERFORM public.responder_questao(v_sessao_id, v_questao_id, 'C', 30);
        RAISE EXCEPTION 'trocar a resposta depois de respondida deveria falhar';
    EXCEPTION
        WHEN SQLSTATE '55000' THEN NULL;
    END;

    IF (SELECT resposta FROM public.sessao_questoes
        WHERE sessao_id = v_sessao_id AND questao_id = v_questao_id) <> 'B' THEN
        RAISE EXCEPTION 'a resposta gravada nao pode ser trocada';
    END IF;
    ---------------------------------------------------------------------------
    -- 5. Anti-farm: so o primeiro acerto de cada questao pontua no ranking.
    --    Uma segunda sessao com a mesma questao acerta, mas nao pontua.
    ---------------------------------------------------------------------------
    v_sessao_2_id := (public.iniciar_sessao(10, NULL, NULL, true) ->> 'sessao_id')::uuid;

    -- Garante que a segunda sessao contenha a questao ja pontuada.
    DELETE FROM public.sessao_questoes WHERE sessao_id = v_sessao_2_id;
    INSERT INTO public.sessao_questoes (sessao_id, questao_id, ordem)
    VALUES (v_sessao_2_id, v_questao_id, 1);

    v_resultado := public.responder_questao(v_sessao_2_id, v_questao_id, 'B', 30);

    IF (v_resultado ->> 'acertou')::boolean IS DISTINCT FROM true THEN
        RAISE EXCEPTION 'a segunda sessao deveria acertar a questao: %', v_resultado;
    END IF;

    SELECT pontos, pontua_ranking, pontos_base
    INTO v_pontos, v_pontua_ranking, v_pontos_base
    FROM public.sessao_questoes
    WHERE sessao_id = v_sessao_2_id AND questao_id = v_questao_id;

    IF v_pontua_ranking IS DISTINCT FROM false THEN
        RAISE EXCEPTION 'segundo acerto da mesma questao nao deveria pontuar no ranking';
    END IF;

    IF v_pontos <> 0 THEN
        RAISE EXCEPTION 'segundo acerto da mesma questao deveria valer 0 ponto, veio %', v_pontos;
    END IF;

    IF (SELECT COUNT(*) FROM public.questoes_pontuadas
        WHERE user_id = v_user_id AND questao_id = v_questao_id) <> 1 THEN
        RAISE EXCEPTION 'questoes_pontuadas deveria ter uma unica linha por questao';
    END IF;

    ---------------------------------------------------------------------------
    -- 6. Sequencia: dois acertos seguidos multiplicam os pontos.
    ---------------------------------------------------------------------------
    DELETE FROM public.sessao_questoes WHERE sessao_id = v_sessao_2_id;
    INSERT INTO public.sessao_questoes (sessao_id, questao_id, ordem)
    VALUES (v_sessao_2_id, v_questao_id, 1), (v_sessao_2_id, v_questao_2_id, 2);

    PERFORM public.responder_questao(v_sessao_2_id, v_questao_id, 'B', 30);

    SELECT sequencia, mult_sequencia
    INTO v_sequencia, v_mult_sequencia
    FROM public.sessao_questoes
    WHERE sessao_id = v_sessao_2_id AND questao_id = v_questao_id;

    IF v_sequencia <> 1 THEN
        RAISE EXCEPTION 'sequencia da primeira questao deveria ser 1, veio %', v_sequencia;
    END IF;

    PERFORM public.responder_questao(v_sessao_2_id, v_questao_2_id, 'A', 30);

    SELECT sequencia, mult_sequencia
    INTO v_sequencia, v_mult_sequencia
    FROM public.sessao_questoes
    WHERE sessao_id = v_sessao_2_id AND questao_id = v_questao_2_id;

    IF v_sequencia <> 2 THEN
        RAISE EXCEPTION 'sequencia do segundo acerto deveria ser 2, veio %', v_sequencia;
    END IF;

    IF v_mult_sequencia <> 1.1 THEN
        RAISE EXCEPTION 'mult_sequencia do segundo acerto deveria ser 1.1, veio %', v_mult_sequencia;
    END IF;
    ---------------------------------------------------------------------------
    -- 7. Preferencia "somente ao finalizar": responder nao devolve gabarito
    --    nem comentario, e o retry tambem nao.
    ---------------------------------------------------------------------------
    v_sessao_2_id := (public.iniciar_sessao(10, NULL, NULL, false) ->> 'sessao_id')::uuid;

    IF (SELECT filtros->>'mostrar_gabarito_agora' FROM public.sessoes WHERE id = v_sessao_2_id) <> 'false' THEN
        RAISE EXCEPTION 'iniciar_sessao nao guardou a preferencia false';
    END IF;

    DELETE FROM public.sessao_questoes WHERE sessao_id = v_sessao_2_id;
    INSERT INTO public.sessao_questoes (sessao_id, questao_id, ordem)
    VALUES (v_sessao_2_id, v_questao_id, 1);

    v_resultado := public.responder_questao(v_sessao_2_id, v_questao_id, 'B', 30);

    IF v_resultado ? 'gabarito' THEN
        RAISE EXCEPTION 'com a preferencia desligada o gabarito nao deveria ser devolvido: %', v_resultado;
    END IF;

    IF v_resultado ? 'justificativa' THEN
        RAISE EXCEPTION 'com a preferencia desligada o comentario nao deveria ser devolvido: %', v_resultado;
    END IF;

    IF (v_resultado ->> 'acertou')::boolean IS DISTINCT FROM true THEN
        RAISE EXCEPTION 'o usuario ainda deve saber se acertou: %', v_resultado;
    END IF;

    v_resultado_retry := public.responder_questao(v_sessao_2_id, v_questao_id, 'B', 30);

    IF v_resultado_retry ? 'gabarito' OR v_resultado_retry ? 'justificativa' THEN
        RAISE EXCEPTION 'o retry nao pode devolver gabarito com a preferencia desligada: %', v_resultado_retry;
    END IF;

    -- carregar_sessao tambem nao pode vazar o gabarito de questoes respondidas.
    IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements((public.carregar_sessao(v_sessao_2_id) -> 'questoes')) AS questao
        WHERE questao -> 'resultado' ? 'gabarito'
    ) THEN
        RAISE EXCEPTION 'carregar_sessao vazou gabarito de questao ja respondida';
    END IF;

    -- Mas carregar_sessao devolve os filtros, para o front respeitar a preferencia.
    IF (public.carregar_sessao(v_sessao_2_id) -> 'filtros' ->> 'mostrar_gabarito_agora') <> 'false' THEN
        RAISE EXCEPTION 'carregar_sessao deveria devolver a preferencia nos filtros';
    END IF;

    ---------------------------------------------------------------------------
    -- 8. Revisao: so funciona em sessao finalizada e devolve o gabarito
    --    completo, incluindo questoes respondidas na sessao com preferencia
    --    desligada.
    ---------------------------------------------------------------------------
    BEGIN
        PERFORM public.obter_revisao(v_sessao_2_id);
        RAISE EXCEPTION 'obter_revisao deveria falhar em sessao nao finalizada';
    EXCEPTION
        WHEN SQLSTATE 'P0002' THEN NULL;
    END;

    PERFORM public.finalizar_sessao(v_sessao_2_id);

    v_resultado := public.obter_revisao(v_sessao_2_id);

    IF (v_resultado -> 'questoes') IS NULL
       OR jsonb_array_length(v_resultado -> 'questoes') <> 1 THEN
        RAISE EXCEPTION 'a revisao deveria trazer uma questao: %', v_resultado;
    END IF;

    IF (v_resultado -> 'questoes' -> 0 ->> 'gabarito') IS DISTINCT FROM 'B' THEN
        RAISE EXCEPTION 'a revisao deveria trazer o gabarito: %', v_resultado;
    END IF;

    IF (v_resultado -> 'questoes' -> 0 ->> 'justificativa') IS DISTINCT FROM 'Comentário da questão 1' THEN
        RAISE EXCEPTION 'a revisao deveria trazer o comentario: %', v_resultado;
    END IF;

    IF (v_resultado -> 'questoes' -> 0 ->> 'resposta_usuario') IS DISTINCT FROM 'B' THEN
        RAISE EXCEPTION 'a revisao deveria trazer a resposta do usuario: %', v_resultado;
    END IF;

    IF (v_resultado -> 'questoes' -> 0 ->> 'acertou')::boolean IS DISTINCT FROM true THEN
        RAISE EXCEPTION 'a revisao deveria trazer o acerto: %', v_resultado;
    END IF;

    IF (v_resultado -> 'questoes' -> 0 ->> 'materia') IS DISTINCT FROM 'Matéria Teste' THEN
        RAISE EXCEPTION 'a revisao deveria trazer a materia: %', v_resultado;
    END IF;

    ---------------------------------------------------------------------------
    -- 9. Grants: anon nao pode executar nenhuma das RPCs.
    ---------------------------------------------------------------------------
    IF has_function_privilege('anon', 'public.responder_questao(uuid,uuid,text,integer)', 'EXECUTE') THEN
        RAISE EXCEPTION 'anon pode executar responder_questao';
    END IF;

    IF has_function_privilege('anon', 'public.iniciar_sessao(integer,smallint[],smallint[],boolean)', 'EXECUTE') THEN
        RAISE EXCEPTION 'anon pode executar iniciar_sessao';
    END IF;

    IF has_function_privilege('anon', 'public.obter_revisao(uuid)', 'EXECUTE') THEN
        RAISE EXCEPTION 'anon pode executar obter_revisao';
    END IF;

    IF has_function_privilege('anon', 'public.carregar_sessao(uuid)', 'EXECUTE') THEN
        RAISE EXCEPTION 'anon pode executar carregar_sessao';
    END IF;

    IF NOT has_function_privilege('authenticated', 'public.responder_questao(uuid,uuid,text,integer)', 'EXECUTE') THEN
        RAISE EXCEPTION 'authenticated nao pode executar responder_questao';
    END IF;

    IF NOT has_function_privilege('authenticated', 'public.obter_revisao(uuid)', 'EXECUTE') THEN
        RAISE EXCEPTION 'authenticated nao pode executar obter_revisao';
    END IF;

    ---------------------------------------------------------------------------
    -- 10. Limpeza: o banco de dados nao deve ficar com dados de teste.
    ---------------------------------------------------------------------------
    DELETE FROM public.questoes_pontuadas WHERE user_id = v_user_id;
    DELETE FROM public.sessao_questoes
    WHERE sessao_id IN (SELECT id FROM public.sessoes WHERE user_id = v_user_id);
    DELETE FROM public.sessoes WHERE user_id = v_user_id;
    DELETE FROM public.questoes WHERE codigo LIKE 'TESTE-RESPONDER%';
    DELETE FROM public.bancas WHERE slug = 'banca-teste-responder';
    DELETE FROM public.materias WHERE slug = 'materia-teste-responder';
    DELETE FROM public.profiles WHERE id = v_user_id;
    DELETE FROM auth.users WHERE id = v_user_id;

    RAISE NOTICE 'Todos os testes de responder_questao passaram.';
END;
$$;