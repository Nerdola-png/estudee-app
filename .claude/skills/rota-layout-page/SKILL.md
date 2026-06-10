---
name: rota-layout-page
description: Use when creating any new route in the Next.js App Router — covers when to create layout.tsx, page.tsx, and loading.tsx, and what goes in each file
---

# Padrão layout / page / loading — Estudee App

## Overview
Cada rota do App Router pode ter 3 arquivos com responsabilidades distintas. Criar só o que for necessário — `page.tsx` é obrigatório, os outros são opcionais.

## Responsabilidade de cada arquivo

| Arquivo | Para quê | Quando criar |
|---------|----------|--------------|
| `page.tsx` | Conteúdo principal da rota | Sempre |
| `layout.tsx` | UI persistente que envolve filhos (nav, sidebar) | Quando a rota tem subrotas ou UI compartilhada |
| `loading.tsx` | Skeleton/spinner enquanto `page.tsx` carrega | Quando a page faz fetch assíncrono |

## Estrutura de exemplo — rota `/estudar`

```
src/app/
  estudar/
    layout.tsx    ← sidebar ou nav compartilhados entre /estudar/*
    page.tsx      ← listagem de simulados
    loading.tsx   ← skeleton enquanto carrega simulados
    [id]/
      page.tsx    ← simulado individual
      loading.tsx
```

## Templates

**page.tsx (Server Component com auth):**
```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function EstudarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: simulados } = await supabase
    .from("respostas")
    .select("*")
    .eq("user_id", user.id);

  return <div>{/* conteúdo */}</div>;
}
```

**layout.tsx:**
```tsx
export default function EstudarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="estudar-wrapper">
      {/* nav ou sidebar específicos desta seção */}
      <main>{children}</main>
    </div>
  );
}
```

**loading.tsx:**
```tsx
export default function Loading() {
  return (
    <div style={{ padding: "40px", color: "var(--muted)" }}>
      Carregando…
    </div>
  );
}
```

## Regras deste projeto

- Rotas protegidas: checar `user` no topo do `page.tsx` e fazer `redirect("/login")` se null
- Adicionar rota nova em `PROTECTED_ROUTES` no `middleware.ts` se exigir auth
- `layout.tsx` herda do layout pai — não repetir `<html>` ou `<body>`
- `loading.tsx` ativa automaticamente enquanto o Server Component resolve — não precisa de `Suspense` manual
