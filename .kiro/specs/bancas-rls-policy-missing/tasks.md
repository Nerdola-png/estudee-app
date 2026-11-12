# Implementation Plan

## Overview

Corrige o bug de RLS na tabela `bancas` criando as policies de SELECT ausentes via migration SQL, seguindo o padrão já estabelecido para a tabela `materias`.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1", "2"] },
    { "wave": 2, "tasks": ["3.1"] },
    { "wave": 3, "tasks": ["3.2"] },
    { "wave": 4, "tasks": ["3.3", "3.4"] },
    { "wave": 5, "tasks": ["4"] }
  ]
}
```

## Tasks

- [ ] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Bancas RLS Blocks All Reads
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: The bug is deterministic — scope the property to the concrete failing case: any authenticated Supabase client querying `bancas` receives zero rows
  - Create a test file (e.g., `supabase/tests/bancas-rls.test.ts` or equivalent) using Supabase's local testing setup
  - Test: query `public.bancas` as `authenticated` role and assert `data.length > 0`
  - Run test on UNFIXED code (before the migration is applied)
  - **EXPECTED OUTCOME**: Test FAILS with `data = []` (confirms RLS is blocking reads)
  - Document the counterexample: "SELECT on bancas as authenticated returns [] even though rows exist"
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Materias and Questoes Read Access Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: `SELECT id, nome FROM public.materias` as `authenticated` returns all rows on unfixed code
  - Observe: `SELECT id FROM public.questoes WHERE ativo = true` as `authenticated` returns active questions only on unfixed code
  - Observe: `INSERT INTO public.bancas` as `authenticated` is rejected (no write grants)
  - Write property-based tests:
    - For all authenticated queries on `materias`: result rows > 0 and no error
    - For all authenticated queries on `questoes`: only rows with `ativo = true` are returned
    - For any write attempt on `bancas` as `authenticated` or `anon`: operation is rejected
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 3. Fix bancas RLS missing policies

  - [ ] 3.1 Create migration to add SELECT policies for bancas
    - Create file `supabase/migrations/20261108120000_fix_bancas_rls_policy.sql`
    - Add policy `"bancas_read_for_anon"` on `public.bancas` for SELECT to `anon` using `(true)`
    - Add policy `"bancas_read_for_authenticated"` on `public.bancas` for SELECT to `authenticated` using `(true)`
    - Follow the exact same pattern as the `materias` policies in `20261106130000_enable_question_read_access.sql`
    - Do NOT modify any existing policies or grants for other tables
    - _Bug_Condition: isBugCondition(context) where context.table = 'bancas' AND rls_enabled = true AND count(policies) = 0_
    - _Expected_Behavior: expectedBehavior(result) where result.data.length > 0 AND result.error = null_
    - _Preservation: Materias, questoes and bancas write-protection are unchanged_
    - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2_

  - [ ] 3.2 Apply the migration to the local/remote Supabase instance
    - Run `npx supabase db push` or `npx supabase migration up` to apply the migration
    - Confirm the policies appear in the Supabase dashboard under Authentication > Policies > bancas
    - _Requirements: 3.1_

  - [ ] 3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Bancas Query Returns Rows
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior (query returns `data.length > 0`)
    - Run bug condition exploration test from step 1 on FIXED code
    - **EXPECTED OUTCOME**: Test PASSES (confirms bancas are now readable)
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - No Regressions on Other Tables
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2 on FIXED code
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions on materias, questoes, or bancas write protection)
    - Confirm all tests still pass after migration is applied

- [ ] 4. Checkpoint - Ensure all tests pass
  - Run the full test suite to confirm no regressions
  - Manually verify the `/filtros` page in the browser: open the Bancas dropdown and confirm options appear
  - Confirm that typing in the bancas autocomplete filters results correctly
  - Ensure the Matérias dropdown still works as before
  - Ask the user if any questions arise

## Notes

- A correção é uma migration SQL pura — não requer mudanças no código TypeScript.
- O padrão exato a seguir está em `supabase/migrations/20261106130000_enable_question_read_access.sql` (seção de `materias`).
- Após aplicar a migration, o Supabase retorna as bancas imediatamente sem necessidade de reiniciar o servidor.
