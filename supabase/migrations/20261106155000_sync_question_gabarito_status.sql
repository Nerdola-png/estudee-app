do $$
begin
  create type public.status_gabarito as enum (
    'nao_verificado',
    'preliminar',
    'definitivo',
    'anulada',
    'pendente'
  );
exception
  when duplicate_object then null;
end;
$$;

alter table public.questoes
  add column if not exists status_gabarito public.status_gabarito not null default 'nao_verificado';

alter table public.questoes
  alter column gabarito drop not null;
