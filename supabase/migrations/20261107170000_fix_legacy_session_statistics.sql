create or replace function public.obter_estatisticas()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_resumo jsonb;
  v_materias jsonb;
  v_sessoes_recentes jsonb;
begin
  if v_user_id is null then
    raise exception 'Autenticação necessária.' using errcode = '28000';
  end if;

  select jsonb_build_object(
    'sessoes', count(*)::integer,
    'questoes', coalesce(sum(s.total_questoes), 0)::integer,
    'acertos', coalesce(sum(s.acertos), 0)::integer,
    'pontos_total', coalesce(sum(s.pontos_total), 0),
    'tempo_ativo_segundos', coalesce(sum(s.tempo_ativo_segundos), 0)::integer,
    'percentual',
      case
        when coalesce(sum(s.total_questoes), 0) = 0 then 0
        else round(100.0 * coalesce(sum(s.acertos), 0) / sum(s.total_questoes))
      end
  )
  into v_resumo
  from public.sessoes as s
  where s.user_id = v_user_id and s.status = 'finalizado';

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'materia', dados.materia,
        'questoes', dados.questoes,
        'acertos', dados.acertos,
        'percentual', round(100.0 * dados.acertos / nullif(dados.questoes, 0)),
        'pontos', dados.pontos,
        'tempo_medio_segundos', round(dados.tempo_medio_ms / 1000.0, 1)
      )
      order by 100.0 * dados.acertos / nullif(dados.questoes, 0), dados.materia
    ),
    '[]'::jsonb
  )
  into v_materias
  from (
    select
      m.nome as materia,
      count(*)::integer as questoes,
      count(*) filter (where sq.correta is true)::integer as acertos,
      coalesce(sum(sq.pontos), 0)::numeric(14, 2) as pontos,
      coalesce(avg(sq.tempo_servidor_ms), 0) as tempo_medio_ms
    from public.sessoes as s
    join public.sessao_questoes as sq on sq.sessao_id = s.id
    join public.questoes as q on q.id = sq.questao_id
    join public.materias as m on m.id = q.materia_id
    where s.user_id = v_user_id
      and s.status = 'finalizado'
      and sq.resposta is not null
    group by m.id, m.nome
  ) as dados;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'sessao_id', recentes.id,
        'finalizada_em', coalesce(recentes.finalizada_em, recentes.finished_at),
        'total_questoes', recentes.total_questoes,
        'acertos', coalesce(recentes.acertos, 0),
        'pontos', recentes.pontos_total
      )
      order by coalesce(recentes.finalizada_em, recentes.finished_at) desc
    ),
    '[]'::jsonb
  )
  into v_sessoes_recentes
  from (
    select id, finalizada_em, finished_at, total_questoes, acertos, pontos_total
    from public.sessoes
    where user_id = v_user_id and status = 'finalizado'
    order by coalesce(finalizada_em, finished_at) desc
    limit 5
  ) as recentes;

  return jsonb_build_object(
    'resumo', v_resumo,
    'materias', v_materias,
    'sessoes_recentes', v_sessoes_recentes
  );
end;
$$;

revoke all on function public.obter_estatisticas() from public, anon;
grant execute on function public.obter_estatisticas() to authenticated;
