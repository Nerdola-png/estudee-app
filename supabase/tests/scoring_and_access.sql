do $$
declare
  v_result record;
begin
  select * into v_result
  from public.calcular_pontos(true, 1, 0, 60, 1, 1::smallint);
  if v_result.pontos <> 110 or v_result.bonus_tempo <> 0.1000 then
    raise exception 'Instant correct answer score mismatch: %', row_to_json(v_result);
  end if;

  select * into v_result
  from public.calcular_pontos(true, 1, 60000, 60, 1, 1::smallint);
  if v_result.pontos <> 100 or v_result.bonus_tempo <> 0 then
    raise exception 'Reference-time score mismatch: %', row_to_json(v_result);
  end if;

  select * into v_result
  from public.calcular_pontos(true, 1, 180001, 60, 1, 1::smallint);
  if v_result.pontos <> 100 or v_result.bonus_tempo <> 0 then
    raise exception 'Slow answer score mismatch: %', row_to_json(v_result);
  end if;

  select * into v_result
  from public.calcular_pontos(true, 1, 60000, 60, 7, 1::smallint);
  if v_result.pontos <> 150 or v_result.mult_sequencia <> 1.5 then
    raise exception 'Sequence cap score mismatch: %', row_to_json(v_result);
  end if;

  select * into v_result
  from public.calcular_pontos(false, 3, 0, 60, 0, 1::smallint);
  if v_result.pontos <> 0 or v_result.pontos_base <> 0 then
    raise exception 'Incorrect answer must score zero: %', row_to_json(v_result);
  end if;

  if has_column_privilege('authenticated', 'public.profiles', 'plano', 'UPDATE') then
    raise exception 'Authenticated users can still update profiles.plano.';
  end if;

  if has_column_privilege('authenticated', 'public.sessao_questoes', 'pontos', 'SELECT') then
    raise exception 'Authenticated users can read score columns directly.';
  end if;

  if has_function_privilege('anon', 'public.iniciar_sessao(integer,smallint[],smallint[],boolean)', 'EXECUTE') then
    raise exception 'Anonymous users can execute iniciar_sessao.';
  end if;

  if not has_function_privilege('authenticated', 'public.obter_ranking(text,text)', 'EXECUTE') then
    raise exception 'Authenticated users cannot execute obter_ranking.';
  end if;

  if not has_function_privilege('authenticated', 'public.obter_sessao_em_andamento()', 'EXECUTE') then
    raise exception 'Authenticated users cannot query their active session.';
  end if;

  if has_function_privilege('authenticated', 'public.registrar_assinatura_pix_manual(uuid,integer,uuid)', 'EXECUTE') then
    raise exception 'Authenticated users can register manual Pix subscriptions.';
  end if;

  if not has_function_privilege('service_role', 'public.registrar_assinatura_pix_manual(uuid,integer,uuid)', 'EXECUTE') then
    raise exception 'Service role cannot register manual Pix subscriptions.';
  end if;
end;
$$;
