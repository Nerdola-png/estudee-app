-- Libera enunciado e alternativas de questões ativas sem expor gabarito ou justificativa.

alter table public.questoes enable row level security;
revoke all on table public.questoes from anon, authenticated;
grant select (
	id,
	codigo,
	foco,
	tipo,
	banca_id,
	materia_id,
	cargo_id,
	carreira_id,
	estado_prova,
	ano,
	texto_base_id,
	enunciado,
	alternativas,
	ativo,
	created_at
) on table public.questoes to anon, authenticated;

create policy "questoes_read_active_for_anon"
on public.questoes
for select
to anon
using (ativo = true);

create policy "questoes_read_active_for_authenticated"
on public.questoes
for select
to authenticated
using (ativo = true);

-- Também libera a referência de matérias usada nos filtros.
alter table public.materias enable row level security;
revoke all on table public.materias from anon, authenticated;
grant select on table public.materias to anon, authenticated;

create policy "materias_read_for_anon"
on public.materias
for select
to anon
using (true);

create policy "materias_read_for_authenticated"
on public.materias
for select
to authenticated
using (true);
