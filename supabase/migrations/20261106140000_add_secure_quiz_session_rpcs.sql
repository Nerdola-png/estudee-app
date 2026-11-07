create or replace function public.iniciar_sessao(
  p_total_questoes integer,
  p_banca_id smallint default null,
  p_materia_id smallint default null
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

  if p_banca_id is not null and not exists (
    select 1 from public.bancas where id = p_banca_id
  ) then
    raise exception 'Banca inválida.' using errcode = '22023';
  end if;

  if p_materia_id is not null and not exists (
    select 1 from public.materias where id = p_materia_id
  ) then
    raise exception 'Matéria inválida.' using errcode = '22023';
  end if;

  insert into public.sessoes (user_id, modo, filtros, total_questoes)
  values (
    v_user_id,
    'simulado',
    jsonb_build_object('banca_id', p_banca_id, 'materia_id', p_materia_id),
    p_total_questoes
  )
  returning id into v_sessao_id;

  insert into public.sessao_questoes (sessao_id, questao_id, ordem)
  select v_sessao_id, selecionadas.id, selecionadas.ordem::smallint
  from (
    select
      q.id,
      row_number() over (order by random()) as ordem
    from public.questoes as q
    where q.ativo
      and (p_banca_id is null or q.banca_id = p_banca_id)
      and (p_materia_id is null or q.materia_id = p_materia_id)
    limit p_total_questoes
  ) as selecionadas;

  get diagnostics v_total_inserido = row_count;

  if v_total_inserido = 0 then
    raise exception 'Nenhuma questão ativa corresponde aos filtros.' using errcode = 'P0002';
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
  where id = p_sessao_id and user_id = v_user_id;

  if not found then
    raise exception 'Sessão não encontrada.' using errcode = 'P0002';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', q.id,
        'ordem', sq.ordem,
        'enunciado', q.enunciado,
        'alternativas', q.alternativas,
        'materia', m.nome,
        'resposta', sq.resposta,
        'resultado', case
          when sq.resposta is null then null
          else jsonb_build_object(
            'acertou', sq.correta,
            'gabarito', q.gabarito,
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
    'questoes', v_questoes
  );
end;
$$;

create or replace function public.responder_questao(
  p_sessao_id uuid,
  p_questao_id uuid,
  p_resposta text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_status public.sessao_status;
  v_resposta_existente character(1);
  v_gabarito character(1);
  v_justificativa text;
  v_justificativa_alternativas jsonb;
  v_alternativas jsonb;
  v_resposta character(1);
  v_acertou boolean;
  v_finalizada boolean;
begin
  if v_user_id is null then
    raise exception 'Autenticação necessária.' using errcode = '28000';
  end if;

  if p_resposta is null or length(trim(p_resposta)) <> 1 then
    raise exception 'Informe uma única alternativa.' using errcode = '22023';
  end if;

  v_resposta := upper(trim(p_resposta))::character(1);

  select status into v_status
  from public.sessoes
  where id = p_sessao_id and user_id = v_user_id
  for update;

  if not found then
    raise exception 'Sessão não encontrada.' using errcode = 'P0002';
  end if;

  select sq.resposta, q.gabarito, q.justificativa, q.justificativa_alternativas, q.alternativas
  into v_resposta_existente, v_gabarito, v_justificativa, v_justificativa_alternativas, v_alternativas
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
      'acertou', v_resposta_existente = v_gabarito,
      'gabarito', v_gabarito,
      'justificativa', v_justificativa,
      'justificativa_alternativas', v_justificativa_alternativas,
      'finalizada', v_status = 'finalizado'
    );
  end if;

  if v_status <> 'em_andamento' then
    raise exception 'A sessão já foi finalizada.' using errcode = '55000';
  end if;

  if not exists (
    select 1
    from jsonb_array_elements(v_alternativas) as alternativa
    where upper(trim(alternativa->>'letra')) = v_resposta::text
  ) then
    raise exception 'Alternativa inválida.' using errcode = '22023';
  end if;

  v_acertou := v_resposta = v_gabarito;

  update public.sessao_questoes
  set resposta = v_resposta,
      correta = v_acertou,
      respondida_at = now()
  where sessao_id = p_sessao_id and questao_id = p_questao_id;

  update public.sessoes
  set acertos = coalesce(acertos, 0) + case when v_acertou then 1 else 0 end
  where id = p_sessao_id;

  select not exists (
    select 1
    from public.sessao_questoes
    where sessao_id = p_sessao_id and resposta is null
  ) into v_finalizada;

  if v_finalizada then
    update public.sessoes
    set status = 'finalizado', finished_at = now()
    where id = p_sessao_id;
  end if;

  return jsonb_build_object(
    'acertou', v_acertou,
    'gabarito', v_gabarito,
    'justificativa', v_justificativa,
    'justificativa_alternativas', v_justificativa_alternativas,
    'finalizada', v_finalizada
  );
end;
$$;

revoke all on function public.iniciar_sessao(integer, smallint, smallint) from public, anon;
revoke all on function public.carregar_sessao(uuid) from public, anon;
revoke all on function public.responder_questao(uuid, uuid, text) from public, anon;
grant execute on function public.iniciar_sessao(integer, smallint, smallint) to authenticated;
grant execute on function public.carregar_sessao(uuid) to authenticated;
grant execute on function public.responder_questao(uuid, uuid, text) to authenticated;
