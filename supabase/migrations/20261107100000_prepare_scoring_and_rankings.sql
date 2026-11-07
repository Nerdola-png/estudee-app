alter table public.profiles
  add column nickname text,
  add column ranking_opt_in boolean not null default false,
  add column uf text,
  add column municipio_ibge text;

update public.profiles
set uf = upper(estado)
where estado ~ '^[A-Za-z]{2}$';

alter table public.profiles
  add constraint profiles_nickname_check
    check (nickname is null or (nickname = btrim(nickname) and nickname ~ '^[A-Za-z0-9_]{3,24}$')),
  add constraint profiles_uf_check
    check (uf is null or uf = any (array[
      'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
      'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
    ])),
  add constraint profiles_municipio_ibge_check
    check (municipio_ibge is null or municipio_ibge ~ '^[0-9]{7}$');

create unique index profiles_nickname_lower_key
  on public.profiles (lower(nickname))
  where nickname is not null;

revoke update on table public.profiles from authenticated;
grant update (
  nome,
  sobrenome,
  cidade,
  estado,
  telefone,
  concurso_alvo,
  avatar_url,
  nickname,
  ranking_opt_in,
  uf,
  municipio_ibge
) on table public.profiles to authenticated;

create table public.planos_config (
  plano text primary key check (plano in ('gratuito', 'premium')),
  tamanhos_permitidos integer[] not null,
  ranking_visivel boolean not null,
  provedor_preco_id text,
  periodicidade text check (periodicidade is null or periodicidade in ('mensal', 'anual'))
);

insert into public.planos_config (plano, tamanhos_permitidos, ranking_visivel)
values
  ('gratuito', array[10, 20, 30, 40], false),
  ('premium', array[10, 20, 30, 40, 50, 60, 70, 80, 90, 100], true);

alter table public.planos_config enable row level security;
create policy "planos_config_read_authenticated"
  on public.planos_config for select to authenticated using (true);
revoke all on table public.planos_config from anon, authenticated;
grant select on table public.planos_config to authenticated;
grant all on table public.planos_config to service_role;

create table public.assinaturas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plano text not null check (plano in ('gratuito', 'premium')),
  status text not null check (status in ('ativa', 'cancelada', 'inadimplente', 'expirada')),
  inicio timestamptz not null default now(),
  periodo_fim timestamptz,
  cancelar_no_fim boolean not null default false,
  origem text not null check (origem in ('pix_manual', 'stripe', 'admin')),
  ativado_por uuid references auth.users(id) on delete set null,
  provedor text,
  provedor_cliente_id text,
  provedor_assinatura_id text,
  atualizado_em timestamptz not null default now(),
  check (periodo_fim is null or periodo_fim > inicio)
);

create index assinaturas_user_active_idx
  on public.assinaturas (user_id, inicio desc)
  where status = 'ativa';
create unique index assinaturas_provider_subscription_key
  on public.assinaturas (provedor, provedor_assinatura_id)
  where provedor is not null and provedor_assinatura_id is not null;

alter table public.assinaturas enable row level security;
revoke all on table public.assinaturas from anon, authenticated;
grant all on table public.assinaturas to service_role;

create table public.eventos_pagamento (
  provedor_evento_id text primary key,
  provedor text not null,
  tipo text not null,
  payload jsonb not null,
  processado_em timestamptz
);

alter table public.eventos_pagamento enable row level security;
revoke all on table public.eventos_pagamento from anon, authenticated;
grant all on table public.eventos_pagamento to service_role;

alter table public.questoes
  add column peso_dificuldade smallint not null default 1,
  add column t_ref_segundos integer not null default 30,
  add constraint questoes_peso_dificuldade_check
    check (peso_dificuldade between 1 and 3),
  add constraint questoes_t_ref_segundos_check
    check (t_ref_segundos between 1 and 1800);

alter table public.sessoes
  add column pontos_total numeric(14, 2) not null default 0,
  add column tempo_ativo_segundos integer not null default 0,
  add column ultima_atividade_em timestamptz not null default now(),
  add column finalizada_em timestamptz;

alter table public.sessao_questoes
  add column exibida_em timestamptz,
  add column respondida_em timestamptz,
  add column tempo_servidor_ms integer,
  add column tempo_valido boolean not null default false,
  add column tempo_ativo_segundos integer not null default 0,
  add column sequencia smallint not null default 0,
  add column pontos_base numeric(12, 2) not null default 0,
  add column bonus_tempo numeric(6, 4) not null default 0,
  add column mult_sequencia numeric(4, 2) not null default 1,
  add column pontos numeric(14, 2) not null default 0,
  add column pontua_ranking boolean not null default false,
  add column formula_versao smallint not null default 1,
  add constraint sessao_questoes_tempo_servidor_check
    check (tempo_servidor_ms is null or tempo_servidor_ms >= 0),
  add constraint sessao_questoes_tempo_ativo_check
    check (tempo_ativo_segundos >= 0),
  add constraint sessao_questoes_sequencia_check
    check (sequencia >= 0),
  add constraint sessao_questoes_pontos_check
    check (pontos >= 0);

create table public.questoes_pontuadas (
  user_id uuid not null references auth.users(id) on delete cascade,
  questao_id uuid not null references public.questoes(id) on delete cascade,
  primeira_sessao_id uuid not null references public.sessoes(id) on delete cascade,
  pontuada_em timestamptz not null default now(),
  primary key (user_id, questao_id)
);

alter table public.questoes_pontuadas enable row level security;
revoke all on table public.questoes_pontuadas from anon, authenticated;
grant all on table public.questoes_pontuadas to service_role;

create table public.ranking_pontos (
  user_id uuid not null references auth.users(id) on delete cascade,
  periodo_tipo text not null check (periodo_tipo in ('geral', 'semanal', 'mensal')),
  periodo_inicio date not null,
  pontos numeric(16, 2) not null default 0 check (pontos >= 0),
  uf text,
  municipio_ibge text,
  atualizado_em timestamptz not null default now(),
  primary key (user_id, periodo_tipo, periodo_inicio)
);

create index ranking_pontos_scope_idx
  on public.ranking_pontos (periodo_tipo, periodo_inicio, uf, municipio_ibge, pontos desc);

alter table public.ranking_pontos enable row level security;
revoke all on table public.ranking_pontos from anon, authenticated;
grant all on table public.ranking_pontos to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nome, sobrenome, cidade, estado, telefone, concurso_alvo)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data->>'nome'), ''), 'Usuário'),
    coalesce(nullif(btrim(new.raw_user_meta_data->>'sobrenome'), ''), ''),
    coalesce(nullif(btrim(new.raw_user_meta_data->>'cidade'), ''), ''),
    coalesce(nullif(upper(btrim(new.raw_user_meta_data->>'estado')), ''), ''),
    nullif(btrim(new.raw_user_meta_data->>'telefone'), ''),
    nullif(btrim(new.raw_user_meta_data->>'concurso_alvo'), '')
  );
  return new;
end;
$$;

create or replace function public.plano_atual_usuario()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select a.plano
    from public.assinaturas as a
    where a.user_id = (select auth.uid())
      and a.status = 'ativa'
      and (a.periodo_fim is null or a.periodo_fim > now())
    order by a.inicio desc
    limit 1
  ), 'gratuito');
$$;

revoke all on function public.plano_atual_usuario() from public, anon;
grant execute on function public.plano_atual_usuario() to authenticated;

create or replace function public.calcular_pontos(
  p_acertou boolean,
  p_peso_dificuldade integer,
  p_tempo_ms integer,
  p_t_ref_segundos integer,
  p_sequencia integer,
  p_formula_versao smallint default 1
)
returns table (
  pontos_base numeric,
  bonus_tempo numeric,
  mult_sequencia numeric,
  pontos numeric
)
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_base numeric(12, 2);
  v_bonus numeric(6, 4);
  v_mult numeric(4, 2);
begin
  if p_acertou is null
    or p_peso_dificuldade not between 1 and 3
    or p_tempo_ms is null or p_tempo_ms < 0
    or p_t_ref_segundos is null or p_t_ref_segundos < 1
    or p_sequencia is null or p_sequencia < 0
    or p_formula_versao is null or p_formula_versao <> 1
  then
    raise exception 'Parâmetros inválidos para cálculo de pontos.' using errcode = '22023';
  end if;

  v_base := case when p_acertou then 100 * p_peso_dificuldade else 0 end;
  v_bonus := case
    when not p_acertou or p_tempo_ms > 3000::bigint * p_t_ref_segundos then 0
    else round((0.10 * greatest(0, 1 - p_tempo_ms / (p_t_ref_segundos * 1000.0)))::numeric, 4)
  end;
  v_mult := case
    when not p_acertou then 1
    else least(1.5, 1 + 0.1 * greatest(0, p_sequencia - 1))
  end;

  return query
  select v_base, v_bonus, v_mult, round(v_base * (1 + v_bonus) * v_mult, 2);
end;
$$;

revoke all on function public.calcular_pontos(boolean, integer, integer, integer, integer, smallint) from public, anon, authenticated;
