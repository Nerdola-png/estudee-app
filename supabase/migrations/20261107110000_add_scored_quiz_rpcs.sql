update public.questoes
set t_ref_segundos = greatest(10, least(1800, ceil(length(enunciado) / 18.0)::integer))
where t_ref_segundos = 30;

drop function if exists public.responder_questao(uuid, uuid, text);

create or replace function public.iniciar_sessao(
  p_total_questoes integer,
  p_banca_ids smallint[] default null,
  p_materia_ids smallint[] default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_plano text;
  v_tamanhos integer[];
  v_sessao_id uuid;
  v_total_elegivel integer;
  v_total_inserido integer;
begin
  if v_user_id is null then
    raise exception 'Autenticação necessária.' using errcode = '28000';
  end if;

  v_plano := public.plano_atual_usuario();
  select tamanhos_permitidos into v_tamanhos
  from public.planos_config
  where plano = v_plano;

  if p_total_questoes is null or not (p_total_questoes = any(v_tamanhos)) then
    raise exception 'Esse tamanho de simulado não está disponível no seu plano.' using errcode = '22023';
  end if;

  if coalesce(cardinality(p_banca_ids), 0) > 0 and exists (
    select 1
    from unnest(p_banca_ids) as banca_id
    where not exists (select 1 from public.bancas where id = banca_id)
  ) then
    raise exception 'Uma ou mais bancas são inválidas.' using errcode = '22023';
  end if;

  if coalesce(cardinality(p_materia_ids), 0) > 0 and exists (
    select 1
    from unnest(p_materia_ids) as materia_id
    where not exists (select 1 from public.materias where id = materia_id)
  ) then
    raise exception 'Uma ou mais matérias são inválidas.' using errcode = '22023';
  end if;

  select count(*) into v_total_elegivel
  from public.questoes as q
  where q.ativo
    and (coalesce(cardinality(p_banca_ids), 0) = 0 or q.banca_id = any(p_banca_ids))
    and (coalesce(cardinality(p_materia_ids), 0) = 0 or q.materia_id = any(p_materia_ids))
    and (
      q.status_gabarito = 'anulada'
      or exists (
        select 1
        from jsonb_array_elements(q.alternativas) as alternativa
        where upper(trim(coalesce(alternativa->>'key', alternativa->>'letra'))) = upper(trim(q.gabarito))
      )
    );

  if v_total_elegivel < p_total_questoes then
    raise exception 'Há apenas % questões elegíveis para esses filtros; reduza o tamanho do simulado.',
      v_total_elegivel using errcode = 'P0002';
  end if;

  insert into public.sessoes (user_id, modo, filtros, total_questoes, ultima_atividade_em)
  values (
    v_user_id,
    'simulado',
    jsonb_build_object(
      'banca_ids', coalesce(to_jsonb(p_banca_ids), '[]'::jsonb),
      'materia_ids', coalesce(to_jsonb(p_materia_ids), '[]'::jsonb)
    ),
    p_total_questoes,
    clock_timestamp()
  )
  returning id into v_sessao_id;

  insert into public.sessao_questoes (sessao_id, questao_id, ordem)
  select v_sessao_id, selecionadas.id, selecionadas.ordem::smallint
  from (
    select
      q.id,
      row_number() over (
        order by
          exists (
            select 1
            from public.questoes_pontuadas as qp
            where qp.user_id = v_user_id and qp.questao_id = q.id
          ),
          random()
      ) as ordem
    from public.questoes as q
    where q.ativo
      and (coalesce(cardinality(p_banca_ids), 0) = 0 or q.banca_id = any(p_banca_ids))
      and (coalesce(cardinality(p_materia_ids), 0) = 0 or q.materia_id = any(p_materia_ids))
      and (
        q.status_gabarito = 'anulada'
        or exists (
          select 1
          from jsonb_array_elements(q.alternativas) as alternativa
          where upper(trim(coalesce(alternativa->>'key', alternativa->>'letra'))) = upper(trim(q.gabarito))
        )
      )
    limit p_total_questoes
  ) as selecionadas;

  get diagnostics v_total_inserido = row_count;

  if v_total_inserido <> p_total_questoes then
    raise exception 'Não foi possível montar o simulado completo. Tente novamente.' using errcode = 'P0002';
  end if;

  return jsonb_build_object(
    'sessao_id', v_sessao_id,
    'total_questoes', v_total_inserido
  );
end;
$$;

create or replace function public.carregar_sessao(p_sessao_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_sessao public.sessoes%rowtype;
  v_questoes jsonb;
begin
  if v_user_id is null then
    raise exception 'Autenticação necessária.' using errcode = '28000';
  end if;

  select * into v_sessao
  from public.sessoes
  where id = p_sessao_id and user_id = v_user_id
  for update;

  if not found then
    raise exception 'Sessão não encontrada.' using errcode = 'P0002';
  end if;

  if v_sessao.status = 'em_andamento' then
    update public.sessoes
    set ultima_atividade_em = clock_timestamp()
    where id = p_sessao_id;

    update public.sessao_questoes
    set exibida_em = clock_timestamp()
    where sessao_id = p_sessao_id
      and questao_id = (
        select questao_id
        from public.sessao_questoes
        where sessao_id = p_sessao_id and resposta is null
        order by ordem
        limit 1
      );
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', q.id,
        'ordem', sq.ordem,
        'enunciado', q.enunciado,
        'alternativas', q.alternativas,
        'materia', m.nome,
        'anulada', q.status_gabarito = 'anulada',
        'resposta', sq.resposta,
        'resultado', case
          when sq.resposta is null then null
          else jsonb_build_object(
            'acertou', sq.correta,
            'anulada', q.status_gabarito = 'anulada',
            'gabarito', case when q.status_gabarito = 'anulada' then null else q.gabarito end,
            'justificativa', q.justificativa,
            'justificativa_alternativas', q.justificativa_alternativas
          )
        end
      ) order by sq.ordem
    ),
    '[]'::jsonb
  ) into v_questoes
  from public.sessao_questoes as sq
  join public.questoes as q on q.id = sq.questao_id
  join public.materias as m on m.id = q.materia_id
  where sq.sessao_id = p_sessao_id;

  return jsonb_build_object(
    'sessao_id', v_sessao.id,
    'status', v_sessao.status,
    'total_questoes', v_sessao.total_questoes,
    'acertos', coalesce(v_sessao.acertos, 0),
    'started_at', v_sessao.started_at,
    'tempo_ativo_segundos', v_sessao.tempo_ativo_segundos,
    'questoes', v_questoes
  );
end;
$$;

create or replace function public.responder_questao(
  p_sessao_id uuid,
  p_questao_id uuid,
  p_resposta text,
  p_tempo_ativo_segundos integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
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
begin
  if v_user_id is null then
    raise exception 'Autenticação necessária.' using errcode = '28000';
  end if;

  if p_resposta is null or length(trim(p_resposta)) <> 1 then
    raise exception 'Informe uma única alternativa.' using errcode = '22023';
  end if;

  if p_tempo_ativo_segundos is not null
    and (p_tempo_ativo_segundos < 0 or p_tempo_ativo_segundos > 2592000)
  then
    raise exception 'Tempo ativo inválido.' using errcode = '22023';
  end if;

  v_resposta := upper(trim(p_resposta))::character(1);

  select * into v_sessao
  from public.sessoes
  where id = p_sessao_id and user_id = v_user_id
  for update;

  if not found then
    raise exception 'Sessão não encontrada.' using errcode = 'P0002';
  end if;

  select
    sq.resposta,
    sq.exibida_em,
    q.gabarito,
    q.justificativa,
    q.justificativa_alternativas,
    q.alternativas,
    q.status_gabarito,
    q.t_ref_segundos,
    q.peso_dificuldade
  into
    v_resposta_existente,
    v_exibida_em,
    v_gabarito,
    v_justificativa,
    v_justificativa_alternativas,
    v_alternativas,
    v_status_gabarito,
    v_t_ref,
    v_peso
  from public.sessao_questoes as sq
  join public.questoes as q on q.id = sq.questao_id
  where sq.sessao_id = p_sessao_id and sq.questao_id = p_questao_id
  for update of sq;

  if not found then
    raise exception 'Questão não pertence a esta sessão.' using errcode = '22023';
  end if;

  if v_resposta_existente is not null then
    if v_resposta_existente <> v_resposta then
      raise exception 'Esta questão já foi respondida.' using errcode = '55000';
    end if;

    return jsonb_build_object(
      'acertou', v_status_gabarito = 'anulada' or upper(trim(v_resposta_existente)) = upper(trim(v_gabarito)),
      'anulada', v_status_gabarito = 'anulada',
      'gabarito', case when v_status_gabarito = 'anulada' then null else v_gabarito end,
      'justificativa', v_justificativa,
      'justificativa_alternativas', v_justificativa_alternativas,
      'finalizada', v_sessao.status = 'finalizado'
    );
  end if;

  if v_sessao.status <> 'em_andamento' then
    raise exception 'A sessão não está em andamento.' using errcode = '55000';
  end if;

  if not exists (
    select 1
    from jsonb_array_elements(v_alternativas) as alternativa
    where upper(trim(coalesce(alternativa->>'key', alternativa->>'letra'))) = v_resposta::text
  ) then
    raise exception 'Alternativa inválida.' using errcode = '22023';
  end if;

  if v_exibida_em is null then
    v_exibida_em := v_now;
  end if;

  v_tempo_ms := least(
    2147483647::numeric,
    greatest(0, floor(extract(epoch from (v_now - v_exibida_em)) * 1000))
  )::integer;
  v_tempo_valido := v_tempo_ms::bigint <= 3000::bigint * v_t_ref;
  v_acertou := v_status_gabarito = 'anulada'
    or upper(trim(v_resposta)) = upper(trim(v_gabarito));

  if v_acertou then
    select sq.sequencia, sq.correta
    into v_ultima_sequencia, v_ultima_correta
    from public.sessao_questoes as sq
    where sq.sessao_id = p_sessao_id and sq.respondida_em is not null
    order by sq.respondida_em desc, sq.ordem desc
    limit 1;

    v_sequencia := case
      when coalesce(v_ultima_correta, false) then coalesce(v_ultima_sequencia, 0) + 1
      else 1
    end;

    insert into public.questoes_pontuadas (user_id, questao_id, primeira_sessao_id)
    values (v_user_id, p_questao_id, p_sessao_id)
    on conflict (user_id, questao_id) do nothing;
    get diagnostics v_linhas_inseridas = row_count;
    v_pontua_ranking := v_linhas_inseridas = 1;
  end if;

  select
    p.pontos_base,
    p.bonus_tempo,
    p.mult_sequencia,
    p.pontos
  into
    v_pontos_base,
    v_bonus_tempo,
    v_mult_sequencia,
    v_pontos
  from public.calcular_pontos(
    v_acertou,
    v_peso,
    v_tempo_ms,
    v_t_ref,
    v_sequencia,
    v_formula
  ) as p;

  if not v_pontua_ranking then
    v_pontos_base := 0;
    v_pontos := 0;
  end if;

  update public.sessao_questoes
  set resposta = v_resposta,
      correta = v_acertou,
      respondida_at = v_now,
      respondida_em = v_now,
      tempo_servidor_ms = v_tempo_ms,
      tempo_valido = v_tempo_valido,
      tempo_ativo_segundos = coalesce(p_tempo_ativo_segundos, tempo_ativo_segundos),
      sequencia = v_sequencia,
      pontos_base = v_pontos_base,
      bonus_tempo = v_bonus_tempo,
      mult_sequencia = v_mult_sequencia,
      pontos = v_pontos,
      pontua_ranking = v_pontua_ranking,
      formula_versao = v_formula
  where sessao_id = p_sessao_id and questao_id = p_questao_id;

  update public.sessoes
  set acertos = (
        select count(*)::smallint
        from public.sessao_questoes
        where sessao_id = p_sessao_id and correta is true
      ),
      pontos_total = (
        select coalesce(sum(pontos), 0)
        from public.sessao_questoes
        where sessao_id = p_sessao_id
      ),
      tempo_ativo_segundos = greatest(
        tempo_ativo_segundos,
        coalesce(p_tempo_ativo_segundos, 0)
      ),
      ultima_atividade_em = v_now
  where id = p_sessao_id;

  return jsonb_build_object(
    'acertou', v_acertou,
    'anulada', v_status_gabarito = 'anulada',
    'gabarito', case when v_status_gabarito = 'anulada' then null else v_gabarito end,
    'justificativa', v_justificativa,
    'justificativa_alternativas', v_justificativa_alternativas,
    'finalizada', false
  );
end;
$$;

create or replace function public.registrar_tempo_ativo(
  p_sessao_id uuid,
  p_tempo_ativo_segundos integer
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tempo integer;
begin
  if auth.uid() is null then
    raise exception 'Autenticação necessária.' using errcode = '28000';
  end if;

  if p_tempo_ativo_segundos is null
    or p_tempo_ativo_segundos < 0
    or p_tempo_ativo_segundos > 2592000
  then
    raise exception 'Tempo ativo inválido.' using errcode = '22023';
  end if;

  update public.sessoes
  set tempo_ativo_segundos = greatest(tempo_ativo_segundos, p_tempo_ativo_segundos),
      ultima_atividade_em = clock_timestamp()
  where id = p_sessao_id
    and user_id = auth.uid()
    and status = 'em_andamento'
  returning tempo_ativo_segundos into v_tempo;

  if not found then
    raise exception 'Sessão não encontrada ou não está em andamento.' using errcode = 'P0002';
  end if;

  return v_tempo;
end;
$$;

create or replace function public.finalizar_sessao(p_sessao_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_sessao public.sessoes%rowtype;
  v_acertos integer;
  v_pontos numeric(14, 2);
  v_uf text;
  v_municipio text;
  v_agora timestamptz := clock_timestamp();
begin
  if v_user_id is null then
    raise exception 'Autenticação necessária.' using errcode = '28000';
  end if;

  select * into v_sessao
  from public.sessoes
  where id = p_sessao_id and user_id = v_user_id
  for update;

  if not found then
    raise exception 'Sessão não encontrada.' using errcode = 'P0002';
  end if;

  if v_sessao.status = 'finalizado' then
    return jsonb_build_object('sessao_id', p_sessao_id, 'finalizada', true);
  end if;

  if v_sessao.status <> 'em_andamento' then
    raise exception 'A sessão não pode ser finalizada.' using errcode = '55000';
  end if;

  if exists (
    select 1 from public.sessao_questoes
    where sessao_id = p_sessao_id and resposta is null
  ) then
    raise exception 'Responda todas as questões antes de finalizar.' using errcode = '55000';
  end if;

  select
    count(*) filter (where correta is true)::integer,
    coalesce(sum(pontos), 0)::numeric(14, 2)
  into v_acertos, v_pontos
  from public.sessao_questoes
  where sessao_id = p_sessao_id;

  select uf, municipio_ibge into v_uf, v_municipio
  from public.profiles
  where id = v_user_id;

  update public.sessoes
  set status = 'finalizado',
      acertos = v_acertos,
      pontos_total = v_pontos,
      finished_at = v_agora,
      finalizada_em = v_agora,
      ultima_atividade_em = v_agora
  where id = p_sessao_id;

  insert into public.ranking_pontos (
    user_id, periodo_tipo, periodo_inicio, pontos, uf, municipio_ibge, atualizado_em
  )
  values
    (v_user_id, 'geral', date '0001-01-01', v_pontos, v_uf, v_municipio, v_agora),
    (v_user_id, 'semanal', date_trunc('week', v_agora)::date, v_pontos, v_uf, v_municipio, v_agora),
    (v_user_id, 'mensal', date_trunc('month', v_agora)::date, v_pontos, v_uf, v_municipio, v_agora)
  on conflict (user_id, periodo_tipo, periodo_inicio)
  do update set
    pontos = public.ranking_pontos.pontos + excluded.pontos,
    uf = excluded.uf,
    municipio_ibge = excluded.municipio_ibge,
    atualizado_em = excluded.atualizado_em;

  return jsonb_build_object('sessao_id', p_sessao_id, 'finalizada', true);
end;
$$;

create or replace function public.obter_resultado(p_sessao_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_sessao public.sessoes%rowtype;
  v_materias jsonb;
  v_questoes_respondidas integer;
  v_tempo_medio numeric;
begin
  if v_user_id is null then
    raise exception 'Autenticação necessária.' using errcode = '28000';
  end if;

  select * into v_sessao
  from public.sessoes
  where id = p_sessao_id and user_id = v_user_id and status = 'finalizado';

  if not found then
    raise exception 'Resultado não disponível para esta sessão.' using errcode = 'P0002';
  end if;

  select count(*)::integer, coalesce(avg(tempo_servidor_ms), 0)
  into v_questoes_respondidas, v_tempo_medio
  from public.sessao_questoes
  where sessao_id = p_sessao_id and resposta is not null;

  select coalesce(
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
  ) into v_materias
  from (
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

  return jsonb_build_object(
    'sessao_id', v_sessao.id,
    'status', v_sessao.status,
    'total_questoes', v_sessao.total_questoes,
    'questoes_respondidas', v_questoes_respondidas,
    'acertos', coalesce(v_sessao.acertos, 0),
    'pontos_total', v_sessao.pontos_total,
    'media_pontos_por_questao', round(v_sessao.pontos_total / nullif(v_sessao.total_questoes, 0), 2),
    'tempo_ativo_segundos', v_sessao.tempo_ativo_segundos,
    'tempo_medio_questao_segundos', round(v_tempo_medio / 1000.0, 1),
    'materias', v_materias
  );
end;
$$;

revoke all on function public.iniciar_sessao(integer, smallint[], smallint[]) from public, anon;
revoke all on function public.carregar_sessao(uuid) from public, anon;
revoke all on function public.responder_questao(uuid, uuid, text, integer) from public, anon;
revoke all on function public.registrar_tempo_ativo(uuid, integer) from public, anon;
revoke all on function public.finalizar_sessao(uuid) from public, anon;
revoke all on function public.obter_resultado(uuid) from public, anon;

grant execute on function public.iniciar_sessao(integer, smallint[], smallint[]) to authenticated;
grant execute on function public.carregar_sessao(uuid) to authenticated;
grant execute on function public.responder_questao(uuid, uuid, text, integer) to authenticated;
grant execute on function public.registrar_tempo_ativo(uuid, integer) to authenticated;
grant execute on function public.finalizar_sessao(uuid) to authenticated;
grant execute on function public.obter_resultado(uuid) to authenticated;
