# Design: Extração de Componentes UI + Migração Tailwind

**Data:** 2026-06-09  
**Status:** Aprovado

## Objetivo

Extrair componentes reutilizáveis duplicados no código, criar estrutura de componentes em `src/app/components/`, instalar shadcn/ui para primitivos e migrar todos os estilos para Tailwind v4.

## Decisões

- **CSS:** Migração completa — inline styles e CSS classes → Tailwind v4
- **Pasta de componentes:** `src/app/components/ui/` (dentro do app)
- **shadcn/ui:** Instalado via CLI para primitivos; foco em componentes custom
- **Formulários:** React Hook Form + Zod para validação em todos os forms

## Estrutura de pastas

```
src/app/components/
  ui/                    ← shadcn/ui (gerados via CLI)
    button.tsx
    input.tsx
    select.tsx
    label.tsx
  Field.tsx              ← custom: label + input + erro
  LeftPanel.tsx          ← custom: painel esquerdo das páginas de auth
  Logo.tsx               ← custom: marca ESTUDEE (sm | md | lg)
  LogoutButton.tsx       ← movido de dashboard/
  StatCard.tsx           ← custom: card de stat do dashboard
```

## Migração de CSS

### Tailwind v4 — tokens de cor em `globals.css`

```css
@theme {
  --color-bg: #0A0C10;
  --color-surface: #12151C;
  --color-surface2: #1A1E28;
  --color-accent: #F5C542;
  --color-accent2: #E8A020;
  --color-text-base: #F0EDE4;
  --color-muted: #8A8D99;
  --color-border: #2A2E3A;
  --color-green: #3FC87A;
}
```

Classes disponíveis após configuração: `bg-accent`, `text-muted`, `border-border`, `bg-surface`, etc.

### Arquivos CSS deletados

- `src/app/estudee.css` — conteúdo migrado para Tailwind nos componentes/páginas
- `src/app/dashboard/dashboard.css` — idem

## shadcn/ui

**Init:**
```bash
npx shadcn@latest init
# Components path: src/app/components/ui
# Tailwind CSS: sim
# CSS variables: sim
```

**Componentes a instalar:**
```bash
npx shadcn@latest add button input select label
```

Apenas esses 4 na v0. Instalar outros (Card, Dialog) conforme demanda.

## Componentes custom

### Field
Wrapper de campo de formulário: label + input/children + mensagem de erro.

```tsx
interface FieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}
```

### LeftPanel
Painel esquerdo das páginas de auth. Hoje copiado em `login/page.tsx` e `cadastro/page.tsx`. Sem props obrigatórias — conteúdo é fixo (branding + lista de features).

### Logo
Marca "ESTUDEE" com variante de tamanho.

```tsx
interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}
```

### LogoutButton
Movido de `src/app/dashboard/LogoutButton.tsx` → `src/app/components/LogoutButton.tsx`. Sem mudança de comportamento.

### StatCard
Card de estatística do dashboard.

```tsx
interface StatCardProps {
  label: string;
  value: React.ReactNode;
  hint: React.ReactNode;
}
```

## Refatoração das páginas

| Página | Mudanças |
|--------|----------|
| `login/page.tsx` | Remove `Field`, `Input` locais → importa de components; inline styles → Tailwind |
| `cadastro/page.tsx` | Idem + remove `Select` local + usa `LeftPanel` de components |
| `dashboard/page.tsx` | Extrai `StatCard`; inline styles → Tailwind; importa `LogoutButton` de components |
| `page.tsx` (landing) | Inline styles → Tailwind; sem extração de componente |

## React Hook Form + Zod

**Pacotes:**
```bash
npm install react-hook-form zod @hookform/resolvers
```

**Padrão de uso nos formulários:**

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("E-mail inválido."),
  senha: z.string().min(8, "Mínimo 8 caracteres."),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => { /* chamada Supabase */ };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Field label="E-mail" error={errors.email?.message}>
        <Input {...register("email")} type="email" />
      </Field>
      <Field label="Senha" error={errors.senha?.message}>
        <Input {...register("senha")} type="password" />
      </Field>
    </form>
  );
}
```

**`Field` atualizado** para receber `error` como string diretamente (compatível com RHF):
```tsx
interface FieldProps {
  label: string;
  error?: string;        // errors.campo?.message do RHF
  children: React.ReactNode;
  className?: string;
}
```

**Páginas refatoradas com RHF:**
- `login/page.tsx` — substitui todos os `useState` de form por `useForm` + schema Zod
- `cadastro/page.tsx` — idem, schema mais completo (nome, senha, cidade, estado, etc.)

## O que NÃO entra neste escopo

- MockupCard da landing (usado uma vez)
- Itens de nav do dashboard (usados uma vez)
- TanStack Query (tarefa separada)
- Novos componentes além dos listados
