# Bugfix Requirements Document

## Introduction

Na página `/filtros`, o componente `MultiAutocomplete` recebe as bancas vindas do hook `useOpcoesSimulado`, mas nenhuma banca aparece na lista de opções nem no autocomplete. A investigação identificou que o bug está no hook `useOpcoesSimulado` em `src/hooks/use-quiz.ts`: a query de bancas lança uma exceção ao encontrar qualquer erro do Supabase, porém o problema real é que a query falha silenciosamente ou retorna array vazio por conta de uma política RLS (Row Level Security) ausente ou restritiva na tabela `bancas` — a tabela `materias` tem permissão de leitura pública, enquanto `bancas` não.

A causa raiz identificada pelo fluxo do código é a seguinte: o `Promise.all` dispara `bancasResult` e `materiasResult` em paralelo. Se `bancasResult.error` for truthy, a função lança erro e o estado `erroOpcoes` fica definido, desabilitando o componente inteiro. Se `bancasResult.data` retornar array vazio (sem erro, mas sem dados), o componente fica habilitado porém sem opções de banca para exibir. Em ambos os casos, as bancas não aparecem para o usuário.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN o usuário acessa a página `/filtros` THEN o sistema não exibe nenhuma banca na lista de opções do componente de seleção de banca

1.2 WHEN o usuário digita o nome de uma banca no campo de autocomplete THEN o sistema não retorna nenhum resultado correspondente

1.3 WHEN a query ao Supabase para a tabela `bancas` retorna erro de permissão (RLS) THEN o sistema lança exceção no `queryFn` do `useOpcoesSimulado`, fazendo com que `erroOpcoes` seja definido e todos os filtros fiquem desabilitados

1.4 WHEN a query ao Supabase para a tabela `bancas` retorna array vazio por restrição de RLS sem erro explícito THEN o sistema passa `options={[]}` para o `MultiAutocomplete` de banca, resultando em lista vazia

### Expected Behavior (Correct)

2.1 WHEN o usuário acessa a página `/filtros` THEN o sistema SHALL exibir todas as bancas cadastradas no banco de dados na lista de opções

2.2 WHEN o usuário digita o nome de uma banca no campo de autocomplete THEN o sistema SHALL filtrar e exibir as bancas cujo nome corresponda ao texto digitado

2.3 WHEN a tabela `bancas` possui política RLS que permite leitura por usuários autenticados THEN o sistema SHALL retornar todas as bancas na query `supabase.from('bancas').select('id,nome').order('nome')`

2.4 WHEN as bancas são carregadas com sucesso THEN o sistema SHALL passar o array de bancas corretamente para o `MultiAutocomplete`, habilitando a seleção e o autocomplete

### Unchanged Behavior (Regression Prevention)

3.1 WHEN o usuário seleciona matérias no componente de matérias THEN o sistema SHALL CONTINUE TO exibir e filtrar as matérias normalmente

3.2 WHEN o usuário inicia um simulado sem selecionar banca THEN o sistema SHALL CONTINUE TO iniciar a sessão sem filtro de banca (campo `p_banca_ids` omitido)

3.3 WHEN o usuário seleciona bancas e matérias e clica em "Iniciar simulado" THEN o sistema SHALL CONTINUE TO chamar `iniciar_sessao` com os IDs corretos convertidos para número

3.4 WHEN ocorre erro ao carregar os planos de configuração THEN o sistema SHALL CONTINUE TO exibir a mensagem de erro e o botão "Tentar novamente"
