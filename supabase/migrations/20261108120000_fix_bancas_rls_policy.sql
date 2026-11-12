-- Adiciona policies RLS de leitura para a tabela bancas.
--
-- A tabela bancas tinha RLS habilitado desde a migration baseline, mas nenhuma
-- policy SELECT foi criada. Sem policies, o PostgreSQL nega todas as queries por
-- padrão — mesmo com GRANT SELECT — fazendo o autocomplete de bancas na página
-- /filtros retornar array vazio silenciosamente.
--
-- Segue o mesmo padrão das policies de materias criadas em
-- 20261106130000_enable_question_read_access.sql.

create policy "bancas_read_for_anon"
on public.bancas
for select
to anon
using (true);

create policy "bancas_read_for_authenticated"
on public.bancas
for select
to authenticated
using (true);
