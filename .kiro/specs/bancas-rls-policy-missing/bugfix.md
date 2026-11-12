# Bugfix: Bancas não aparecem nos filtros do simulado

## Introduction

Na página `/filtros`, o componente `MultiAutocomplete` de bancas nunca exibe opções para o usuário — nem ao abrir o dropdown nem ao digitar no autocomplete. As bancas existem no banco de dados Supabase, mas a query retorna zero linhas silenciosamente, sem erro, fazendo o componente se comportar como se não houvesse bancas cadastradas.

## Bug Analysis

### Current Behavior (Defect)

A tabela `public.bancas` tem Row Level Security (RLS) habilitado (`ENABLE ROW LEVEL SECURITY` na migration baseline), mas **nenhuma policy SELECT** foi criada para ela. No Supabase/PostgreSQL, quando RLS está ativo e não existem policies, todas as queries retornam zero linhas por padrão — mesmo que o role possua GRANT SELECT na tabela.

A migration `20261106130000_enable_question_read_access.sql` criou corretamente as policies de leitura para `materias` e `questoes`, mas não criou policies equivalentes para `bancas`, apesar de a tabela já ter GRANTs de SELECT definidos na baseline.

Como resultado, `supabase.from('bancas').select('id,nome').order('nome')` retorna `{ data: [], error: null }` para qualquer usuário autenticado, e o `MultiAutocomplete` recebe um array vazio como `options`.

**Arquivos envolvidos:**
- `supabase/migrations/20261106120000_remote_schema_baseline.sql` — habilita RLS em `bancas` sem criar policies
- `src/hooks/use-quiz.ts` — `useOpcoesSimulado` faz a query que retorna array vazio

**Bug Condition (C(X)):**
```
isBugCondition(context) where:
  context.table = 'bancas'
  AND context.rls_enabled = true
  AND count(SELECT policies WHERE table = 'bancas') = 0
```

### Expected Behavior (Correct)

A query `supabase.from('bancas').select('id,nome').order('nome')` deve retornar todas as linhas da tabela `bancas` para usuários autenticados, da mesma forma que `materias` é acessível graças às suas policies RLS.

**Expected Behavior (P(result)):**
```
expectedBehavior(result) where:
  result.data.length > 0
  AND result.error = null
  AND result.data contains all rows from public.bancas
  AND MultiAutocomplete displays options to the user
```

**Fix:** Criar uma nova migration que adiciona policies RLS de SELECT para `bancas`, seguindo o mesmo padrão de `materias`:

```sql
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
```

### Unchanged Behavior (Regression Prevention)

Os seguintes comportamentos **não devem ser alterados** pela correção:

1. **Matérias continuam acessíveis** — as policies existentes de `materias` não são modificadas.
2. **Questões continuam com acesso restrito** — apenas questões com `ativo = true` são visíveis; gabarito e justificativas permanecem protegidos via column-level grants.
3. **Bancas são somente leitura** — a correção concede apenas SELECT, não INSERT/UPDATE/DELETE.
4. **Escopo de roles correto** — policies se aplicam aos roles `authenticated` e `anon`, sem elevação de privilégios.

## Acceptance Criteria

### 1. Bug Condition Fixed

- **1.1** Uma query `SELECT id, nome FROM public.bancas` feita pelo role `authenticated` retorna todas as bancas (não zero linhas).
- **1.2** O hook `useOpcoesSimulado` retorna `opcoes.bancas` com ao menos um item quando há bancas cadastradas.
- **1.3** O componente `MultiAutocomplete` de bancas exibe as opções ao abrir o dropdown na página `/filtros`.

### 2. Preservation Requirements Met

- **2.1** O hook `useOpcoesSimulado` continua retornando `opcoes.materias` corretamente (sem regressão).
- **2.2** Queries à tabela `questoes` continuam retornando apenas questões com `ativo = true`.
- **2.3** A tabela `bancas` não permite INSERT, UPDATE ou DELETE via cliente Supabase com role `authenticated` ou `anon`.

### 3. Migration Consistency

- **3.1** A nova migration segue o padrão de nomenclatura existente (`YYYYMMDDHHMMSS_descricao.sql`).
- **3.2** A migration não modifica policies ou grants já existentes de outras tabelas.
