alter table public.profiles
  add constraint profiles_ranking_opt_in_details_check
  check (
    not ranking_opt_in
    or (nickname is not null and uf is not null and municipio_ibge is not null)
  );

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

  with candidatas as (
    select
      q.id,
      exists (
        select 1
        from public.sessoes as s
        join public.sessao_questoes as sq on sq.sessao_id = s.id
        where s.user_id = v_user_id
          and sq.questao_id = q.id
          and sq.resposta is not null
      ) as ja_respondida,
      random() as sorteio
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
  ),
  selecionadas as (
    select
      id,
      row_number() over (order by ja_respondida, sorteio)::smallint as ordem
    from candidatas
    order by ja_respondida, sorteio
    limit p_total_questoes
  )
  insert into public.sessao_questoes (sessao_id, questao_id, ordem)
  select v_sessao_id, selecionadas.id, selecionadas.ordem
  from selecionadas;

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

create or replace function public.obter_sessao_em_andamento()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_sessao_id uuid;
begin
  if v_user_id is null then
    raise exception 'Autenticação necessária.' using errcode = '28000';
  end if;

  select s.id into v_sessao_id
  from public.sessoes as s
  where s.user_id = v_user_id
    and s.status = 'em_andamento'
  order by s.ultima_atividade_em desc, s.id desc
  limit 1;

  return v_sessao_id;
end;
$$;

create or replace function public.registrar_assinatura_pix_manual(
  p_user_id uuid,
  p_periodo_dias integer,
  p_ativado_por uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_assinatura_id uuid;
  v_inicio timestamptz := clock_timestamp();
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Operação administrativa não autorizada.' using errcode = '42501';
  end if;

  if p_user_id is null or p_ativado_por is null
    or p_periodo_dias is null or p_periodo_dias not between 1 and 365
  then
    raise exception 'Usuário, operador e período de acesso válidos são obrigatórios.' using errcode = '22023';
  end if;

  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'Usuário não encontrado.' using errcode = 'P0002';
  end if;

  if not exists (select 1 from auth.users where id = p_ativado_por) then
    raise exception 'Operador não encontrado.' using errcode = 'P0002';
  end if;

  update public.assinaturas
  set plano = 'gratuito',
      status = 'cancelada',
      atualizado_em = v_inicio
  where user_id = p_user_id
    and status = 'ativa';

  insert into public.assinaturas (
    user_id,
    plano,
    status,
    inicio,
    periodo_fim,
    origem,
    ativado_por,
    atualizado_em
  )
  values (
    p_user_id,
    'premium',
    'ativa',
    v_inicio,
    v_inicio + make_interval(days => p_periodo_dias),
    'pix_manual',
    p_ativado_por,
    v_inicio
  )
  returning id into v_assinatura_id;

  return v_assinatura_id;
end;
$$;

revoke all on function public.iniciar_sessao(integer, smallint[], smallint[]) from public, anon;
revoke all on function public.obter_sessao_em_andamento() from public, anon;
revoke all on function public.registrar_assinatura_pix_manual(uuid, integer, uuid) from public, anon, authenticated;

grant execute on function public.iniciar_sessao(integer, smallint[], smallint[]) to authenticated;
grant execute on function public.obter_sessao_em_andamento() to authenticated;
grant execute on function public.registrar_assinatura_pix_manual(uuid, integer, uuid) to service_role;
