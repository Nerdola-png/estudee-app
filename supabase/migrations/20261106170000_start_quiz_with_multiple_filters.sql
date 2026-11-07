drop function if exists public.iniciar_sessao(integer, smallint, smallint);

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
  v_sessao_id uuid;
  v_total_inserido integer;
begin
  if v_user_id is null then
    raise exception 'Autenticação necessária.' using errcode = '28000';
  end if;

  if p_total_questoes is null or p_total_questoes < 1 or p_total_questoes > 40 then
    raise exception 'A quantidade deve estar entre 1 e 40.' using errcode = '22023';
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

  insert into public.sessoes (user_id, modo, filtros, total_questoes)
  values (
    v_user_id,
    'simulado',
    jsonb_build_object(
      'banca_ids', coalesce(to_jsonb(p_banca_ids), '[]'::jsonb),
      'materia_ids', coalesce(to_jsonb(p_materia_ids), '[]'::jsonb)
    ),
    p_total_questoes
  )
  returning id into v_sessao_id;

  insert into public.sessao_questoes (sessao_id, questao_id, ordem)
  select v_sessao_id, selecionadas.id, selecionadas.ordem::smallint
  from (
    select q.id, row_number() over (order by random()) as ordem
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

  if v_total_inserido = 0 then
    raise exception 'Nenhuma questão válida corresponde aos filtros.' using errcode = 'P0002';
  end if;

  update public.sessoes
  set total_questoes = v_total_inserido
  where id = v_sessao_id;

  return jsonb_build_object(
    'sessao_id', v_sessao_id,
    'total_questoes', v_total_inserido
  );
end;
$$;

revoke all on function public.iniciar_sessao(integer, smallint[], smallint[]) from public, anon;
grant execute on function public.iniciar_sessao(integer, smallint[], smallint[]) to authenticated;
