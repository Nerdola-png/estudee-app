---
name: tanstack-query
description: Use when fetching data from Supabase or mutating data — covers useQuery and useMutation patterns, custom hook conventions, and where to place query files in this project
---

# TanStack Query — Estudee App

## Overview
Toda busca de dados usa `useQuery`; toda mutação usa `useMutation`. Hooks customizados ficam em `src/hooks/` e encapsulam a lógica do Supabase.

## Estrutura de arquivos

```
src/
  hooks/
    use-questoes.ts      ← queries de leitura
    use-responder.ts     ← mutations
    use-perfil.ts
```

## useQuery — buscar dados

```tsx
// src/hooks/use-questoes.ts
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useQuestoes(materiaId?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["questoes", materiaId],
    queryFn: async () => {
      const query = supabase
        .from("questoes")
        .select("id, enunciado, alternativas, banca, ano, orgao, materia_id")
        .eq("ativa", true);

      if (materiaId) query.eq("materia_id", materiaId);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// Uso no componente
const { data: questoes, isLoading, error } = useQuestoes(materiaId);
```

## useMutation — modificar dados

```tsx
// src/hooks/use-responder.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useResponder() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      questaoId,
      alternativa,
    }: {
      questaoId: string;
      alternativa: string;
    }) => {
      const { data, error } = await supabase.rpc("responder", {
        p_questao_id: questaoId,
        p_alternativa: alternativa,
      });
      if (error) throw error;
      return data; // { acertou, correta, comentario }
    },
    onSuccess: () => {
      // Invalida queries que dependem das respostas
      queryClient.invalidateQueries({ queryKey: ["estatisticas"] });
      queryClient.invalidateQueries({ queryKey: ["perfil"] });
    },
  });
}

// Uso no componente
const { mutate: responder, isPending, data: resultado } = useResponder();
responder({ questaoId, alternativa });
```

## Regras deste projeto

- **Validação de resposta sempre via RPC** `responder()` — nunca buscar gabarito diretamente
- `queryKey` usa array: `["entidade", filtro]` para invalidação granular
- Hooks de query em `src/hooks/` — nunca inline no componente
- Server Components usam Supabase diretamente (sem TanStack); TanStack é só em Client Components
