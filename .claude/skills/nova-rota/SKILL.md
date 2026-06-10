---
name: nova-rota
description: Use when adding a new page or route to this Next.js project — covers file location, imports, CSS, Supabase auth pattern, and scope guardrails from CLAUDE.md
---

# Nova Rota — Estudee App

## Overview
Guia para criar páginas novas neste projeto seguindo as convenções estabelecidas.

## Estrutura de arquivo

```
src/app/
  (public)/          ← rotas sem auth (login, landing)
  (private)/         ← rotas com auth (dashboard, estudar...)
  nome-da-rota/
    page.tsx
    layout.tsx        ← só se precisar de layout próprio
    nome-da-rota.css  ← só se tiver estilo específico
```

## Template básico

**Rota pública (client component):**
```tsx
"use client";
import { createClient } from "@/lib/supabase/client";
import "../../estudee.css";

export default function NomePage() {
  const supabase = createClient();
  // ...
}
```

**Rota protegida (server component):**
```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import "../estudee.css";

export default async function NomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // ...
}
```

## Regras obrigatórias

- Imports Supabase: `@/lib/supabase/client` ou `@/lib/supabase/server` (nunca `@/src/...`)
- Validação de resposta: sempre via RPC `responder()` no servidor — nunca enviar gabarito ao client antes da resposta
- Rotas novas que exigem auth: adicionar em `PROTECTED_ROUTES` no `middleware.ts`
- Tipos: usar `@/types/database`, nunca `any`

## Guardrails de escopo (v0)

Antes de criar qualquer rota, verificar se está na lista permitida:

✅ Permitido: auth, quiz (responde→feedback→próxima→placar), % acerto por matéria  
❌ Fora de escopo: streak, ranking, gamificação, múltiplas carreiras, pagamento, comunidade
