# Bancas não aparecem em /filtros — Bugfix Design

## Overview

Na página `/filtros`, o componente `MultiAutocomplete` de banca nunca exibe opções porque a query `supabase.from('bancas').select('id,nome').order('nome')` retorna array vazio ou erro de permissão. A investigação aponta para uma política de Row Level Security (RLS) ausente ou demasiadamente restritiva na tabela `bancas` no Supabase, enquanto a tabela `materias` já possui permissão de leitura para usuários autenticados. A correção consiste em criar/ajustar a política RLS da tabela `bancas` para permitir leitura por usuários autenticados, espelhando o comportamento já funcional da tabela `materias`.

## Glossary

- **Bug_Condition (C)**: A condição em que a query à tabela `bancas` retorna array vazio ou erro, impedindo o `MultiAutocomplete` de exibir opções.
- **Property (P)**: O comportamento correto — a query à tabela `bancas` deve retornar todos os registros para usuários autenticados, e o `MultiAutocomplete` deve exibir e filtrar as bancas.
- **Preservation**: O comportamento de matérias, inicialização de sessão, planos e todos os demais filtros que já funcionam e devem continuar funcionando.
- **useOpcoesSimulado**: Hook em `src/hooks/use-quiz.ts` que busca bancas e matérias em paralelo via Supabase e alimenta a página `/filtros`.
- **MultiAutocomplete**: Componente em `src/app/components/ui/MultiAutocomplete.tsx` que exibe as opções filtradas por nome via autocomplete.
- **RLS (Row Level Security)**: Mecanismo do PostgreSQL/Supabase que restringe quais linhas um usuário pode acessar em uma tabela. Se nenhuma política `SELECT` existir para usuários autenticados na tabela `bancas`, a query retorna `[]` sem lançar erro (comportamento padrão quando RLS está ativo mas sem política permissiva).

## Bug Details

### Bug Condition

O bug se manifesta quando um usuário autenticado acessa `/filtros` e o Supabase executa `SELECT id, nome FROM bancas ORDER BY nome`. Se a tabela `bancas` tiver RLS habilitado sem uma política `SELECT` que cubra o papel `authenticated`, a query retorna array vazio silenciosamente (sem `error`), fazendo com que `opcoes.bancas` seja `[]` e o `MultiAutocomplete` não exiba nada.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input de tipo { tabela: string, usuario: AuthUser }
  OUTPUT: boolean

  RETURN input.tabela = 'bancas'
         AND input.usuario está autenticado
         AND NOT existePoliticaRLS_SELECT(input.tabela, 'authenticated')
         AND queryRetornaArrayVazioOuErro(input.tabela, input.usuario)
END FUNCTION
```

### Examples

- **Exemplo 1**: Usuário autenticado abre `/filtros`. Query `bancas` retorna `{ data: [], error: null }`. O `MultiAutocomplete` recebe `options=[]` e exibe "Nenhuma banca encontrada." ao digitar qualquer texto. Comportamento esperado: lista de todas as bancas cadastradas.
- **Exemplo 2**: RLS está configurado com política muito restritiva (ex: `WHERE auth.uid() = criador_id`). Query retorna `[]` sem erro. Mesmo efeito — lista vazia.
- **Exemplo 3**: RLS está configurado mas retorna `error: { code: 'PGRST301' }`. O `useOpcoesSimulado` lança a exceção, `erroOpcoes` é definido, e toda a página de filtros fica desabilitada com a mensagem "Não foi possível carregar os filtros do banco."
- **Caso de borda**: Tabela `bancas` vazia no banco (sem registros). Nesse caso `options=[]` é o comportamento correto e não configura bug — deve-se confirmar primeiro que há registros na tabela.

## Expected Behavior

### Preservation Requirements

**Comportamentos que devem continuar inalterados:**
- Matérias continuam sendo carregadas e exibidas normalmente no `MultiAutocomplete` de matérias.
- Iniciar simulado sem selecionar banca continua omitindo `p_banca_ids` na chamada `iniciar_sessao`.
- Iniciar simulado com bancas selecionadas continua enviando os IDs numéricos corretos.
- Erros ao carregar `planos_config` continuam exibindo mensagem de erro com botão "Tentar novamente".
- O componente `MultiAutocomplete` não sofre alterações — o bug está na camada de dados, não na UI.

**Escopo:**
Todos os inputs que não envolvem a query à tabela `bancas` não devem ser afetados pela correção. Isso inclui:
- Queries à tabela `materias`
- Chamadas RPC (`plano_atual_usuario`, `planos_config`, `iniciar_sessao`)
- Lógica de filtragem local no `MultiAutocomplete`
- Navegação e roteamento da página

## Hypothesized Root Cause

Com base na análise do fluxo de código e no comportamento descrito, as causas mais prováveis são:

1. **Política RLS ausente na tabela `bancas`**: A tabela tem RLS habilitado, mas nenhuma política `SELECT` foi criada para o papel `authenticated`. O Supabase retorna `[]` sem erro — esse é o comportamento padrão do PostgreSQL com RLS ativo e sem política permissiva.
   - A tabela `materias` provavelmente já tem a política `CREATE POLICY "allow_read_authenticated" ON materias FOR SELECT TO authenticated USING (true)` ou equivalente.

2. **Política RLS com condição restritiva**: A tabela `bancas` tem RLS com uma política que restringe acesso por `auth.uid()` ou outro critério que não corresponde a nenhum registro para o usuário atual.

3. **Tabela `bancas` em schema diferente**: A tabela pode estar em um schema não exposto ao cliente Supabase (diferente do `public`), fazendo a query retornar vazio.

4. **Tabela `bancas` genuinamente vazia**: Não há registros cadastrados. Deve ser descartado consultando o banco diretamente.

## Correctness Properties

Property 1: Bug Condition — Query de Bancas Retorna Dados

_For any_ usuário autenticado que acessa `/filtros`, a query `supabase.from('bancas').select('id,nome').order('nome')` SHALL retornar um array não vazio contendo todos os registros da tabela `bancas`, desde que existam registros cadastrados e a política RLS permita leitura para o papel `authenticated`.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation — Comportamento de Matérias e Demais Funcionalidades

_For any_ interação do usuário que não envolva a tabela `bancas` (seleção de matérias, iniciar simulado, carregamento de planos), o sistema SHALL produzir exatamente o mesmo resultado que antes da correção, preservando todo o comportamento existente.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

A correção primária é no banco de dados Supabase, não no código TypeScript.

**Arquivo de migração Supabase (a criar)**: `supabase/migrations/<timestamp>_fix_bancas_rls.sql`

**Mudança específica**:
1. **Criar política RLS de leitura para `authenticated` na tabela `bancas`**:
   ```sql
   -- Habilitar RLS na tabela (caso ainda não esteja)
   ALTER TABLE bancas ENABLE ROW LEVEL SECURITY;

   -- Permitir que todos os usuários autenticados leiam todas as bancas
   CREATE POLICY "allow_read_authenticated"
     ON bancas
     FOR SELECT
     TO authenticated
     USING (true);
   ```

2. **Verificação prévia** — antes de aplicar, confirmar no Supabase Dashboard:
   - Se há registros em `bancas` (Table Editor → bancas)
   - Se RLS está habilitado (Authentication → Policies → bancas)
   - Se alguma política `SELECT` já existe para `authenticated`

3. **Alternativa via Dashboard** (sem migração): Em Authentication → Policies → bancas → New Policy → "Enable read access for all authenticated users".

**Código TypeScript** (`src/hooks/use-quiz.ts`): Nenhuma alteração necessária. O hook já faz a query correta — o problema está exclusivamente na política de banco.

**Código do componente** (`src/app/components/ui/MultiAutocomplete.tsx`): Nenhuma alteração necessária.

## Testing Strategy

### Validation Approach

A estratégia de testes segue duas fases: primeiro, confirmar o bug explorando o comportamento atual antes da correção; depois, verificar que a correção funciona e não quebra o comportamento existente.

### Exploratory Bug Condition Checking

**Goal**: Confirmar que a query retorna array vazio antes da correção, validando a hipótese de RLS.

**Test Plan**: Executar a query diretamente no cliente Supabase com um usuário autenticado e observar o resultado. Executar no SQL Editor do Supabase Dashboard como usuário anônimo e autenticado para comparar.

**Test Cases**:
1. **Query direta autenticada**: Executar `SELECT id, nome FROM bancas ORDER BY nome` como usuário autenticado no SQL Editor — se retornar vazio mas houver registros, confirma RLS sem política. (falhará antes da correção)
2. **Console do browser**: Abrir `/filtros`, inspecionar network tab e verificar resposta da query ao endpoint PostgREST de `bancas` — confirma se retorna `[]` ou erro 401/403. (demonstra o bug)
3. **Comparação com matérias**: Executar a mesma query para `materias` como usuário autenticado e comparar — matérias devem retornar dados. (confirma diferença de política)
4. **Caso de borda — tabela vazia**: Verificar no Table Editor se há registros em `bancas`. Se não houver, o bug não é de RLS mas de ausência de dados.

**Expected Counterexamples**:
- Query a `bancas` retorna `[]` mesmo com registros no banco quando feita pelo cliente autenticado
- Possíveis causas: RLS sem política SELECT, política com condição restritiva, schema incorreto

### Fix Checking

**Goal**: Verificar que após aplicar a política RLS, a query retorna todas as bancas.

**Pseudocode:**
```
FOR ALL usuario WHERE usuario.isAuthenticated DO
  result := supabase.from('bancas').select('id,nome').order('nome')
  ASSERT result.error IS NULL
  ASSERT result.data.length > 0
  ASSERT result.data[*].id IS NOT NULL
  ASSERT result.data[*].nome IS NOT NULL
END FOR
```

### Preservation Checking

**Goal**: Verificar que matérias, planos e todas as demais funcionalidades continuam funcionando após a correção.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT comportamento_original(input) = comportamento_corrigido(input)
END FOR
```

**Testing Approach**: Testes de preservação com property-based testing são recomendados porque:
- Geram automaticamente muitos inputs de teste
- Capturam edge cases que testes manuais podem perder
- Oferecem garantia forte de que o comportamento não foi alterado para inputs não-bugados

**Test Cases**:
1. **Preservation de matérias**: Verificar que `supabase.from('materias')` continua retornando dados após a correção
2. **Preservation do fluxo de início**: Verificar que `iniciar_sessao` RPC continua funcionando com e sem `p_banca_ids`
3. **Preservation dos planos**: Verificar que `plano_atual_usuario` e `planos_config` continuam retornando dados corretos

### Unit Tests

- Testar que `useOpcoesSimulado` propaga corretamente o array de bancas retornado pelo Supabase para o estado
- Testar que quando `bancasResult.data` é array não vazio, `opcoes.bancas` reflete o mesmo array
- Testar que quando `bancasResult.error` é definido, o hook entra em estado de erro

### Property-Based Tests

- Gerar arrays aleatórios de bancas `{ id: number, nome: string }[]` e verificar que o `MultiAutocomplete` exibe todas as opções quando `query` está vazia
- Gerar strings aleatórias de query e verificar que a filtragem local retorna subconjunto correto do array original
- Verificar que selecionar/deselecionar bancas não afeta as opções de matérias (independência de estado)

### Integration Tests

- Fluxo completo: acessar `/filtros` → ver bancas carregadas → digitar nome → ver filtro funcionando → selecionar banca → iniciar simulado
- Fluxo de preservação: selecionar apenas matéria (sem banca) e iniciar simulado — deve funcionar como antes
- Fluxo de erro: simular falha na query de bancas e verificar que a mensagem de erro aparece corretamente
