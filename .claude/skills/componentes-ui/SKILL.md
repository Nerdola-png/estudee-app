---
name: componentes-ui
description: Use when creating reusable UI elements like buttons, inputs, cards, or any component used in more than one place — covers file location, naming, and the rule for when to extract
---

# Componentes UI Reutilizáveis — Estudee App

## Overview
Componentes reutilizáveis ficam em `src/components/ui/`. A regra simples: se o mesmo elemento aparece em 2+ lugares, vira componente.

## Estrutura

```
src/
  components/
    ui/
      Button.tsx        ← botões
      Input.tsx         ← inputs de texto
      Select.tsx        ← dropdowns
      Field.tsx         ← label + input + erro
      Card.tsx          ← cards genéricos
      Avatar.tsx        ← avatar com iniciais
    layout/
      Sidebar.tsx       ← componentes de layout maiores
      Header.tsx
```

## Template padrão

```tsx
// src/components/ui/Button.tsx
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  loading = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const styles: Record<Variant, React.CSSProperties> = {
    primary: { background: "var(--accent)", color: "#0A0C10" },
    secondary: { background: "var(--surface2)", color: "var(--text)" },
    outline: { background: "transparent", border: "1px solid var(--border)", color: "var(--text)" },
    ghost: { background: "transparent", color: "var(--muted)" },
  };

  return (
    <button
      disabled={disabled || loading}
      style={{
        padding: "10px 20px",
        borderRadius: "8px",
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 700,
        fontSize: "14px",
        border: "none",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        transition: "all .2s",
        ...styles[variant],
      }}
      {...props}
    >
      {loading ? "Carregando…" : children}
    </button>
  );
}
```

## Regras

- **Nome em PascalCase** — `Button.tsx`, não `button.tsx`
- **Export nomeado** — `export function Button`, não `export default`
- Props estendem o elemento HTML nativo (`ButtonHTMLAttributes`, `InputHTMLAttributes`) para não perder atributos como `onClick`, `disabled`, `type`
- **Sem lógica de negócio** — componentes UI são burros; só recebem props e renderizam
- CSS via CSS variables do projeto (`var(--accent)`, `var(--surface)`, etc.) para respeitar o tema
- Se usar shadcn/ui, importar de `@/components/ui/` (já configurado)

## Quando NÃO extrair

- Componente usado só uma vez e sem previsão de reuso
- Componente muito específico de uma tela (ex: `DashboardStatCard` — fica junto ao dashboard)
