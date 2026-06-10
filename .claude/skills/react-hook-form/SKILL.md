---
name: react-hook-form
description: Use when creating or editing any form in this project — covers useForm setup, Zod schema, Field component integration, and error display pattern
---

# React Hook Form + Zod — Estudee App

## Overview
Todo formulário usa `useForm` do React Hook Form com `zodResolver`. Validação definida em schema Zod — nunca `useState` para estado de form.

## Localização dos schemas
Schemas Zod ficam em `src/schema/<contexto>.ts` (um arquivo por contexto), **nunca inline na página**. Cada arquivo exporta o(s) schema(s) e o(s) tipo(s) derivado(s). Importar via alias `@/schema/<contexto>`.

```
src/schema/
  login.ts      ← loginSchema, resetSchema, LoginData, ResetData
  cadastro.ts   ← cadastroSchema, CadastroData
```

```tsx
import { loginSchema, type LoginData } from "@/schema/login";
```

## Dependências

```bash
npm install react-hook-form zod @hookform/resolvers
```

## Padrão completo

```tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Field } from "@/app/components/Field";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";

const schema = z.object({
  email: z.string().email("E-mail inválido."),
  senha: z.string().min(8, "Mínimo 8 caracteres."),
});

type FormData = z.infer<typeof schema>;

export default function MeuForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    // chamada Supabase aqui
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Field label="E-mail" error={errors.email?.message}>
        <Input {...register("email")} type="email" placeholder="seu@email.com" />
      </Field>

      <Field label="Senha" error={errors.senha?.message}>
        <Input {...register("senha")} type="password" placeholder="Mínimo 8 caracteres" />
      </Field>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Enviando…" : "Entrar →"}
      </Button>
    </form>
  );
}
```

## Schemas dos formulários existentes

**Login (`login/page.tsx`):**
```ts
const loginSchema = z.object({
  email: z.string().email("E-mail inválido."),
  senha: z.string().min(1, "Informe a senha."),
});
```

**Cadastro (`cadastro/page.tsx`):**
```ts
const cadastroSchema = z.object({
  nome: z.string().min(1, "Informe seu nome."),
  sobrenome: z.string().min(1, "Informe seu sobrenome."),
  email: z.string().email("E-mail inválido."),
  senha: z.string().min(8, "Mínimo 8 caracteres."),
  confirmarSenha: z.string(),
  cidade: z.string().min(1, "Informe sua cidade."),
  estado: z.string().min(2, "Selecione seu estado."),
  telefone: z.string().optional(),
  concurso_alvo: z.string().optional(),
}).refine(d => d.senha === d.confirmarSenha, {
  message: "As senhas não coincidem.",
  path: ["confirmarSenha"],
});
```

## Regras

- Schema Zod sempre fora do componente (não dentro da função)
- Tipo derivado do schema: `type FormData = z.infer<typeof schema>` — nunca tipo manual
- Erros exibidos via `Field`: `error={errors.campo?.message}`
- `isSubmitting` do RHF substitui `useState` de loading
- `noValidate` no `<form>` para desabilitar validação nativa do browser
