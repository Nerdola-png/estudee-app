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
    where upper(trim(coalesce(alternativa->>'key', alternativa->>'letra'))) = v_resposta::text
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
