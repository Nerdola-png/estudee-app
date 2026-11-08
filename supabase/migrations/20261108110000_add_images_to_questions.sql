-- Imagens em questões e textos de apoio.
--  * coluna `imagens` (jsonb, array de {path, alt}) em questoes e textos_base
--  * bucket público `questoes-imagens` (leitura pública; escrita só via service role)
--  * carregar_sessao passa a devolver as imagens da questão e do texto de apoio
-- `path` é relativo ao bucket: a URL pública é montada no front.

alter table public.questoes
  add column if not exists imagens jsonb not null default '[]'::jsonb;
alter table public.textos_base
  add column if not exists imagens jsonb not null default '[]'::jsonb;

alter table public.questoes
  drop constraint if exists questoes_imagens_array_check;
alter table public.questoes
  add constraint questoes_imagens_array_check check (jsonb_typeof(imagens) = 'array');

alter table public.textos_base
  drop constraint if exists textos_base_imagens_array_check;
alter table public.textos_base
  add constraint textos_base_imagens_array_check check (jsonb_typeof(imagens) = 'array');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'questoes-imagens',
  'questoes-imagens',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

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
        'imagens', q.imagens,
        'texto_base', case
          when tb.id is null then null
          else jsonb_build_object(
            'titulo', tb.titulo,
            'conteudo', tb.conteudo,
            'fonte', tb.fonte,
            'imagens', tb.imagens
          )
        end,
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
  left join public.textos_base as tb on tb.id = q.texto_base_id
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

revoke all on function public.carregar_sessao(uuid) from public, anon;
grant execute on function public.carregar_sessao(uuid) to authenticated;
