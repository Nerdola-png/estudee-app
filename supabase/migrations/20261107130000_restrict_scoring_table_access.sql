revoke all on table public.sessoes, public.sessao_questoes
from anon, authenticated;

revoke select on table public.profiles from authenticated;
grant select (
  id,
  nome,
  sobrenome,
  cidade,
  estado,
  telefone,
  concurso_alvo,
  avatar_url,
  created_at,
  nickname,
  ranking_opt_in,
  uf,
  municipio_ibge
) on table public.profiles to authenticated;

grant all on table public.sessoes, public.sessao_questoes to service_role;
