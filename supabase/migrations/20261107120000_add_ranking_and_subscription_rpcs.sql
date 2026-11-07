create or replace function public.obter_minha_posicao(
  p_escopo text,
  p_periodo text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_uf text;
  v_municipio text;
  v_posicao bigint;
  v_pontos numeric(16, 2);
  v_periodo_inicio date;
begin
  if v_user_id is null then
    raise exception 'Autenticação necessária.' using errcode = '28000';
  end if;

  if p_escopo not in ('nacional', 'estadual', 'municipal')
    or p_periodo not in ('geral', 'semanal', 'mensal')
  then
    raise exception 'Escopo ou período inválido.' using errcode = '22023';
  end if;

  select uf, municipio_ibge into v_uf, v_municipio
  from public.profiles
  where id = v_user_id;

  if p_escopo = 'estadual' and v_uf is null then
    raise exception 'Informe sua UF no perfil para consultar a posição estadual.' using errcode = '22023';
  end if;
  if p_escopo = 'municipal' and v_municipio is null then
    raise exception 'Informe seu município IBGE no perfil para consultar a posição local.' using errcode = '22023';
  end if;

  v_periodo_inicio := case p_periodo
    when 'geral' then date '0001-01-01'
    when 'semanal' then date_trunc('week', current_date)::date
    else date_trunc('month', current_date)::date
  end;

  select ranked.posicao, ranked.pontos
  into v_posicao, v_pontos
  from (
    select
      rp.user_id,
      rp.pontos,
      row_number() over (order by rp.pontos desc, p.nickname asc) as posicao
    from public.ranking_pontos as rp
    join public.profiles as p on p.id = rp.user_id
    where rp.periodo_tipo = p_periodo
      and rp.periodo_inicio = v_periodo_inicio
      and p.ranking_opt_in
      and (p_escopo = 'nacional' or rp.uf = v_uf)
      and (p_escopo <> 'municipal' or rp.municipio_ibge = v_municipio)
  ) as ranked
  where ranked.user_id = v_user_id;

  return jsonb_build_object(
    'escopo', p_escopo,
    'periodo', p_periodo,
    'posicao', v_posicao,
    'pontos', v_pontos
  );
end;
$$;

create or replace function public.obter_ranking(
  p_escopo text,
  p_periodo text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_plano text;
  v_ranking_visivel boolean;
  v_uf text;
  v_municipio text;
  v_periodo_inicio date;
  v_itens jsonb;
  v_minha_posicao jsonb;
begin
  if v_user_id is null then
    raise exception 'Autenticação necessária.' using errcode = '28000';
  end if;

  if p_escopo not in ('nacional', 'estadual', 'municipal')
    or p_periodo not in ('geral', 'semanal', 'mensal')
  then
    raise exception 'Escopo ou período inválido.' using errcode = '22023';
  end if;

  v_plano := public.plano_atual_usuario();
  select ranking_visivel into v_ranking_visivel
  from public.planos_config
  where plano = v_plano;

  if not coalesce(v_ranking_visivel, false) then
    raise exception 'O ranking completo está disponível apenas no plano Premium.' using errcode = '42501';
  end if;

  select uf, municipio_ibge into v_uf, v_municipio
  from public.profiles
  where id = v_user_id;

  if p_escopo = 'estadual' and v_uf is null then
    raise exception 'Informe sua UF no perfil para consultar o ranking estadual.' using errcode = '22023';
  end if;
  if p_escopo = 'municipal' and v_municipio is null then
    raise exception 'Informe seu município IBGE no perfil para consultar o ranking local.' using errcode = '22023';
  end if;

  v_periodo_inicio := case p_periodo
    when 'geral' then date '0001-01-01'
    when 'semanal' then date_trunc('week', current_date)::date
    else date_trunc('month', current_date)::date
  end;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'posicao', ranked.posicao,
        'nickname', ranked.nickname,
        'pontos', ranked.pontos
      ) order by ranked.posicao
    ),
    '[]'::jsonb
  ) into v_itens
  from (
    select
      p.nickname,
      rp.pontos,
      row_number() over (order by rp.pontos desc, p.nickname asc) as posicao
    from public.ranking_pontos as rp
    join public.profiles as p on p.id = rp.user_id
    where rp.periodo_tipo = p_periodo
      and rp.periodo_inicio = v_periodo_inicio
      and p.ranking_opt_in
      and (p_escopo = 'nacional' or rp.uf = v_uf)
      and (p_escopo <> 'municipal' or rp.municipio_ibge = v_municipio)
  ) as ranked
  where ranked.posicao <= 100;

  v_minha_posicao := public.obter_minha_posicao(p_escopo, p_periodo);

  return jsonb_build_object(
    'escopo', p_escopo,
    'periodo', p_periodo,
    'ranking', v_itens,
    'minha_posicao', v_minha_posicao
  );
end;
$$;

create or replace function public.aplicar_evento_assinatura(
  p_evento_id text,
  p_evento_tipo text,
  p_payload jsonb,
  p_user_id uuid,
  p_plano text,
  p_status text,
  p_origem text,
  p_provedor text,
  p_provedor_cliente_id text,
  p_provedor_assinatura_id text,
  p_periodo_fim timestamptz,
  p_ativado_por uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inserido text;
begin
  if p_evento_id is null or btrim(p_evento_id) = ''
    or p_user_id is null
    or p_evento_tipo is null or btrim(p_evento_tipo) = ''
    or p_payload is null
    or p_plano not in ('gratuito', 'premium')
    or p_status not in ('ativa', 'cancelada', 'inadimplente', 'expirada')
    or p_origem not in ('pix_manual', 'stripe', 'admin')
    or p_provedor_assinatura_id is null
  then
    raise exception 'Evento de assinatura inválido.' using errcode = '22023';
  end if;

  if (p_status = 'ativa' and p_plano <> 'premium')
    or (p_status <> 'ativa' and p_plano <> 'gratuito')
  then
    raise exception 'Plano e status de assinatura incompatíveis.' using errcode = '22023';
  end if;

  insert into public.eventos_pagamento (provedor_evento_id, provedor, tipo, payload)
  values (p_evento_id, coalesce(p_provedor, p_origem), p_evento_tipo, p_payload)
  on conflict (provedor_evento_id) do nothing
  returning provedor_evento_id into v_inserido;

  if v_inserido is null then
    return jsonb_build_object('processado', false, 'duplicado', true);
  end if;

  if p_status = 'ativa' then
    insert into public.assinaturas (
      user_id,
      plano,
      status,
      inicio,
      periodo_fim,
      origem,
      ativado_por,
      provedor,
      provedor_cliente_id,
      provedor_assinatura_id,
      atualizado_em
    )
    values (
      p_user_id,
      'premium',
      'ativa',
      now(),
      p_periodo_fim,
      p_origem,
      p_ativado_por,
      p_provedor,
      p_provedor_cliente_id,
      p_provedor_assinatura_id,
      now()
    )
    on conflict (provedor, provedor_assinatura_id)
      where provedor is not null and provedor_assinatura_id is not null
    do update set
      plano = 'premium',
      status = 'ativa',
      periodo_fim = excluded.periodo_fim,
      cancelar_no_fim = false,
      atualizado_em = now();
  else
    update public.assinaturas
    set plano = 'gratuito',
        status = p_status,
        periodo_fim = coalesce(p_periodo_fim, periodo_fim),
        atualizado_em = now()
    where user_id = p_user_id
      and provedor = p_provedor
      and provedor_assinatura_id = p_provedor_assinatura_id
      and status = 'ativa';
  end if;

  update public.eventos_pagamento
  set processado_em = now()
  where provedor_evento_id = p_evento_id;

  return jsonb_build_object('processado', true, 'duplicado', false);
end;
$$;

create or replace function public.abandonar_sessoes_inativas()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_abandonadas integer;
begin
  update public.sessoes
  set status = 'abandonado'
  where status = 'em_andamento'
    and ultima_atividade_em < now() - interval '30 days';

  get diagnostics v_abandonadas = row_count;
  return v_abandonadas;
end;
$$;

revoke all on function public.obter_minha_posicao(text, text) from public, anon;
revoke all on function public.obter_ranking(text, text) from public, anon;
revoke all on function public.aplicar_evento_assinatura(text, text, jsonb, uuid, text, text, text, text, text, text, timestamptz, uuid) from public, anon, authenticated;
revoke all on function public.abandonar_sessoes_inativas() from public, anon, authenticated;

grant execute on function public.obter_minha_posicao(text, text) to authenticated;
grant execute on function public.obter_ranking(text, text) to authenticated;
grant execute on function public.aplicar_evento_assinatura(text, text, jsonb, uuid, text, text, text, text, text, text, timestamptz, uuid) to service_role;
grant execute on function public.abandonar_sessoes_inativas() to service_role;
