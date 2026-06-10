# Componentes UI + Tailwind v4 + shadcn/ui + RHF Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extrair componentes reutilizáveis, instalar shadcn/ui e React Hook Form, e migrar todos os estilos para Tailwind v4.

**Architecture:** Setup tokens Tailwind v4 → shadcn/ui init → primitivos shadcn → componentes custom → migrar páginas. Componentes em `src/app/components/` (shadcn/ui em `ui/`). Formulários com React Hook Form + Zod — sem useState para valores de form.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS v4, shadcn/ui, React Hook Form, Zod, Supabase, TypeScript strict

---

### Task 1: Configurar tokens Tailwind v4 + fontes em globals.css e layout.tsx

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Substituir `src/app/globals.css` inteiro pelo conteúdo abaixo:**

```css
@import "tailwindcss";

@theme {
  /* Cores do projeto */
  --color-bg: #0A0C10;
  --color-surface: #12151C;
  --color-surface2: #1A1E28;
  --color-accent: #F5C542;
  --color-accent2: #E8A020;
  --color-text-base: #F0EDE4;
  --color-muted: #8A8D99;
  --color-border: #2A2E3A;
  --color-green: #3FC87A;

  /* Tipografia — mapeada de next/font CSS vars */
  --font-bebas: var(--font-bebas-neue);
  --font-sans: var(--font-dm-sans);
}

*, *::before, *::after { box-sizing: border-box; }

body {
  background: var(--color-bg);
  color: var(--color-text-base);
  font-family: var(--font-sans, 'DM Sans', sans-serif);
  font-size: 15px;
  line-height: 1.6;
  overflow-x: hidden;
}
```

- [ ] **Substituir `src/app/layout.tsx` pelo conteúdo abaixo:**

```tsx
import type { Metadata } from "next";
import { DM_Sans, Bebas_Neue } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Estudee — Questões para Concursos",
  description: "Questões comentadas por aprovados para Brigada Militar e PC-RS.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${dmSans.variable} ${bebasNeue.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```

- [ ] **Verificar que o servidor dev inicia sem erros:**

```bash
npm run dev
```

Esperado: servidor rodando em http://localhost:3000 sem erros de compilação.

---

### Task 2: Instalar e inicializar shadcn/ui

**Files:**
- Create: `components.json`
- Create: `src/lib/utils.ts`
- Modify: `src/app/globals.css` (shadcn adiciona variáveis CSS)

- [ ] **Rodar o init do shadcn/ui:**

```bash
npx shadcn@latest init
```

Responder as perguntas assim:
- Which style? → **Default**
- Which base color? → **Neutral**
- Where is your global CSS file? → `src/app/globals.css`
- Would you like to use CSS variables? → **yes**
- Where is your tailwind.config? → deixar em branco (Tailwind v4 não usa config)
- Configure import alias for components? → `@/app/components`
- Configure import alias for utils? → `@/lib/utils`
- Are you using React Server Components? → **yes**

- [ ] **Verificar que os arquivos foram criados:**

```bash
# Deve existir:
# components.json
# src/lib/utils.ts
```

- [ ] **Verificar que `src/lib/utils.ts` contém o utilitário `cn`:**

```ts
// Esperado em src/lib/utils.ts:
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Rodar `npm run dev` e confirmar que ainda compila.**

---

### Task 3: Instalar primitivos shadcn/ui

**Files:**
- Create: `src/app/components/ui/button.tsx`
- Create: `src/app/components/ui/input.tsx`
- Create: `src/app/components/ui/select.tsx`
- Create: `src/app/components/ui/label.tsx`

- [ ] **Instalar os 4 primitivos:**

```bash
npx shadcn@latest add button input select label
```

- [ ] **Confirmar que os 4 arquivos existem em `src/app/components/ui/`.**

- [ ] **Rodar `npx tsc --noEmit` e confirmar que não há erros de tipo.**

---

### Task 4: Instalar React Hook Form + Zod

- [ ] **Instalar os pacotes:**

```bash
npm install react-hook-form zod @hookform/resolvers
```

- [ ] **Confirmar as dependências em `package.json`:**

```json
"react-hook-form": "...",
"zod": "...",
"@hookform/resolvers": "..."
```

---

### Task 5: Criar componente Field

**Files:**
- Create: `src/app/components/Field.tsx`

- [ ] **Criar `src/app/components/Field.tsx`:**

```tsx
import { cn } from "@/lib/utils";
import { Label } from "@/app/components/ui/label";

interface FieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function Field({ label, error, children, className }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label
        className={cn(
          "text-xs font-semibold tracking-wide uppercase",
          error ? "text-red-400" : "text-muted"
        )}
      >
        {label}
      </Label>
      {children}
      {error && (
        <span className="text-xs text-red-400">{error}</span>
      )}
    </div>
  );
}
```

- [ ] **Rodar `npx tsc --noEmit` — sem erros.**

---

### Task 6: Criar componente Logo

**Files:**
- Create: `src/app/components/Logo.tsx`

- [ ] **Criar `src/app/components/Logo.tsx`:**

```tsx
import { cn } from "@/lib/utils";

const sizes = {
  sm: "text-xl tracking-widest",
  md: "text-2xl tracking-widest",
  lg: "text-4xl tracking-widest",
};

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Logo({ size = "md", className }: LogoProps) {
  return (
    <span
      className={cn(
        "font-bebas text-accent",
        sizes[size],
        className
      )}
    >
      ESTU<span className="text-text-base">DEE</span>
    </span>
  );
}
```

- [ ] **Rodar `npx tsc --noEmit` — sem erros.**

---

### Task 7: Criar componente LeftPanel

**Files:**
- Create: `src/app/components/LeftPanel.tsx`

- [ ] **Criar `src/app/components/LeftPanel.tsx`:**

```tsx
import Link from "next/link";
import { Logo } from "@/app/components/Logo";

export function LeftPanel() {
  return (
    <div className="bg-surface border-r border-border hidden md:flex flex-col justify-between p-10 relative overflow-hidden">
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[radial-gradient(circle,rgba(245,197,66,0.07)_0%,transparent_70%)]" />
      <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(63,200,122,0.05)_0%,transparent_70%)]" />

      <Link href="/" className="relative z-10">
        <Logo size="lg" />
      </Link>

      <div className="relative z-10">
        <h2 className="font-bebas text-5xl leading-none tracking-wide mb-4">
          QUESTÕES REAIS,<br />
          RANKING <em className="text-accent not-italic">REAL</em>,<br />
          APROVAÇÃO REAL.
        </h2>
        <p className="text-muted text-sm leading-relaxed max-w-sm mb-9">
          Estude com questões de provas já aplicadas, acumule pontos e veja seu
          nome subir no ranking da sua cidade.
        </p>
        <ul className="flex flex-col gap-3">
          {[
            { icon: "🎯", text: "Filtros por banca, cargo, matéria e estado" },
            { icon: "🔥", text: "Sequência de estudos — não deixe o fogo apagar" },
            { icon: "🏆", text: "Ranking por cidade, estado e nacional" },
            { icon: "📊", text: "Histórico inteligente: sem repetir o que já acertou" },
          ].map(({ icon, text }) => (
            <li key={text} className="flex items-center gap-2.5 text-sm text-muted">
              <span className="w-7 h-7 bg-accent/10 rounded-md flex items-center justify-center text-sm flex-shrink-0">
                {icon}
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative z-10 text-xs text-border">
        Estudee © 2025 — Versão Web
      </div>
    </div>
  );
}
```

- [ ] **Rodar `npx tsc --noEmit` — sem erros.**

---

### Task 8: Criar componente StatCard

**Files:**
- Create: `src/app/components/StatCard.tsx`

- [ ] **Criar `src/app/components/StatCard.tsx`:**

```tsx
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  hint: React.ReactNode;
  accentValue?: boolean;
}

export function StatCard({ label, value, hint, accentValue = false }: StatCardProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="text-[11px] font-bold tracking-widest uppercase text-muted mb-2">
        {label}
      </div>
      <div
        className={cn(
          "font-bebas text-3xl tracking-wide leading-none mb-1",
          accentValue ? "text-accent" : "text-text-base"
        )}
      >
        {value}
      </div>
      <div className="text-[11px] text-muted">{hint}</div>
    </div>
  );
}
```

- [ ] **Rodar `npx tsc --noEmit` — sem erros.**

---

### Task 9: Mover LogoutButton para components/

**Files:**
- Create: `src/app/components/LogoutButton.tsx`
- Delete: `src/app/dashboard/LogoutButton.tsx`

- [ ] **Criar `src/app/components/LogoutButton.tsx`:**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/app/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
      className="border-border text-muted hover:border-muted hover:text-text-base bg-transparent"
    >
      Sair
    </Button>
  );
}
```

- [ ] **Deletar `src/app/dashboard/LogoutButton.tsx`.**

- [ ] **Rodar `npx tsc --noEmit` — sem erros.**

---

### Task 10: Migrar login/page.tsx

**Files:**
- Modify: `src/app/(public)/login/page.tsx`

- [ ] **Substituir `src/app/(public)/login/page.tsx` pelo conteúdo abaixo:**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Field } from "@/app/components/Field";
import { LeftPanel } from "@/app/components/LeftPanel";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";

// ── Schemas ───────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email("E-mail inválido."),
  senha: z.string().min(1, "Informe a senha."),
});

const resetSchema = z.object({
  email: z.string().email("E-mail inválido."),
});

type LoginData = z.infer<typeof loginSchema>;
type ResetData = z.infer<typeof resetSchema>;

// ── Page ─────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const errorParam = searchParams.get("error");
  const supabase = createClient();

  const [showSenha, setShowSenha] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const resetForm = useForm<ResetData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: loginForm.getValues("email") },
  });

  const onLogin = async (data: LoginData) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.senha,
    });

    if (error) {
      const msg =
        error.message.includes("Invalid login credentials") ||
        error.message.includes("invalid_credentials")
          ? "E-mail ou senha incorretos."
          : error.message.includes("Email not confirmed")
          ? "Confirme seu e-mail antes de entrar."
          : "Ocorreu um erro. Tente novamente.";
      loginForm.setError("root", { message: msg });
      return;
    }

    router.push(redirect);
    router.refresh();
  };

  const onReset = async (data: ResetData) => {
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (!error) setResetSent(true);
  };

  // ── Reset enviado ────────────────────────────────────────────────────────
  if (resetSent) {
    return (
      <div className="min-h-screen grid md:grid-cols-2">
        <LeftPanel />
        <div className="flex flex-col justify-center items-center p-12 bg-bg overflow-y-auto">
          <div className="w-full max-w-[420px] text-center">
            <div className="text-5xl mb-5">📬</div>
            <h2 className="font-bebas text-4xl tracking-widest mb-3">VERIFIQUE SEU E-MAIL</h2>
            <p className="text-muted leading-relaxed mb-7">
              Enviamos um link para{" "}
              <strong className="text-text-base">{resetForm.getValues("email")}</strong>.
            </p>
            <button
              className="text-accent text-sm bg-transparent border-none cursor-pointer font-[inherit]"
              onClick={() => { setResetSent(false); setShowReset(false); }}
            >
              ← Voltar ao login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Tela de reset ────────────────────────────────────────────────────────
  if (showReset) {
    return (
      <div className="min-h-screen grid md:grid-cols-2">
        <LeftPanel />
        <div className="flex flex-col justify-center items-center p-12 bg-bg overflow-y-auto">
          <div className="w-full max-w-[420px]">
            <button
              onClick={() => setShowReset(false)}
              className="text-muted text-sm bg-transparent border-none cursor-pointer font-[inherit] flex items-center gap-1.5 mb-5 p-0"
            >
              ← Voltar
            </button>
            <h1 className="font-bebas text-4xl tracking-widest mb-2">RECUPERAR SENHA</h1>
            <p className="text-muted text-sm leading-relaxed mb-8">
              Informe o e-mail da sua conta para receber o link de redefinição.
            </p>
            <form onSubmit={resetForm.handleSubmit(onReset)} noValidate className="flex flex-col gap-5">
              <Field label="E-mail" error={resetForm.formState.errors.email?.message}>
                <Input
                  {...resetForm.register("email")}
                  type="email"
                  placeholder="seu@email.com"
                  autoFocus
                />
              </Field>
              <Button type="submit" disabled={resetForm.formState.isSubmitting} className="w-full">
                {resetForm.formState.isSubmitting ? "Enviando…" : "Enviar link →"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Login principal ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <LeftPanel />
      <div className="flex flex-col justify-center items-center p-12 bg-bg overflow-y-auto">
        <div className="w-full max-w-[420px]">
          {/* Header */}
          <div className="mb-9">
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/25 text-accent px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase mb-4">
              🔥 Sequência te esperando
            </div>
            <h1 className="font-bebas text-4xl tracking-widest mb-2">BEM-VINDO DE VOLTA</h1>
            <p className="text-muted text-sm">
              Não tem conta?{" "}
              <Link href="/cadastro" className="text-accent font-semibold no-underline">
                Criar conta grátis
              </Link>
            </p>
          </div>

          <form onSubmit={loginForm.handleSubmit(onLogin)} noValidate className="flex flex-col gap-4">
            {errorParam === "callback" && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3.5 py-3 text-[13px] text-red-400">
                Não foi possível entrar com o Google. Tente novamente ou use e-mail e senha.
              </div>
            )}
            {loginForm.formState.errors.root?.message && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3.5 py-3 text-[13px] text-red-400">
                {loginForm.formState.errors.root.message}
              </div>
            )}

            <Field label="E-mail" error={loginForm.formState.errors.email?.message}>
              <Input
                {...loginForm.register("email")}
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                autoFocus
              />
            </Field>

            <Field label="Senha" error={loginForm.formState.errors.senha?.message}>
              <div className="relative">
                <Input
                  {...loginForm.register("senha")}
                  type={showSenha ? "text" : "password"}
                  placeholder="Sua senha"
                  autoComplete="current-password"
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-base bg-transparent border-none cursor-pointer leading-none"
                  aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showSenha ? "🙈" : "👁️"}
                </button>
              </div>
            </Field>

            <div className="text-right -mt-2">
              <button
                type="button"
                onClick={() => { setShowReset(true); }}
                className="text-muted text-xs bg-transparent border-none cursor-pointer font-[inherit] underline p-0"
              >
                Esqueci minha senha
              </button>
            </div>

            <Button
              type="submit"
              disabled={loginForm.formState.isSubmitting}
              className="w-full mt-2"
            >
              {loginForm.formState.isSubmitting ? "Entrando…" : "Entrar →"}
            </Button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted">ou</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full border-border text-text-base bg-surface hover:border-muted"
              onClick={async () => {
                await supabase.auth.signInWithOAuth({
                  provider: "google",
                  options: {
                    redirectTo: `${window.location.origin}/auth/callback?next=${redirect}`,
                  },
                });
              }}
            >
              <GoogleIcon />
              Entrar com Google
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
```

- [ ] **Rodar `npx tsc --noEmit` — sem erros.**

---

### Task 11: Migrar cadastro/page.tsx

**Files:**
- Modify: `src/app/cadastro/page.tsx`

- [ ] **Substituir `src/app/cadastro/page.tsx` pelo conteúdo abaixo:**

```tsx
"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Field } from "@/app/components/Field";
import { LeftPanel } from "@/app/components/LeftPanel";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";

const ESTADOS_BR = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const CONCURSOS = ["Polícia Civil","Polícia Militar","Polícia Federal","Polícia Rodoviária Federal","Tribunal de Justiça (TJ)","Tribunal Regional Federal (TRF)","Ministério Público","Defensoria Pública","OAB","Banco do Brasil","Caixa Econômica Federal","INSS","Receita Federal","TCU / TCE","Prefeitura / Câmara Municipal","Não tenho certeza"];

const schema = z.object({
  nome: z.string().min(1, "Informe seu nome."),
  sobrenome: z.string().min(1, "Informe seu sobrenome."),
  email: z.string().email("E-mail inválido."),
  senha: z.string().min(8, "Mínimo 8 caracteres."),
  confirmarSenha: z.string(),
  cidade: z.string().min(1, "Informe sua cidade."),
  estado: z.string().min(2, "Selecione seu estado."),
  telefone: z.string().optional(),
  concurso_alvo: z.string().optional(),
}).refine((d) => d.senha === d.confirmarSenha, {
  message: "As senhas não coincidem.",
  path: ["confirmarSenha"],
});

type FormData = z.infer<typeof schema>;

export default function CadastroPage() {
  const supabase = createClient();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [showSenha, setShowSenha] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("root", { message: "A foto deve ter no máximo 2MB." });
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data: FormData) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.senha,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          nome: data.nome.trim(),
          sobrenome: data.sobrenome.trim(),
          cidade: data.cidade.trim(),
          estado: data.estado,
        },
      },
    });

    if (authError) {
      setError("root", {
        message: authError.message.includes("already registered")
          ? "Este e-mail já está cadastrado. Tente fazer login."
          : authError.message,
      });
      return;
    }

    if (authData.user && avatarFile) {
      const ext = avatarFile.name.split(".").pop();
      const path = `avatars/${authData.user.id}.${ext}`;
      await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
      await supabase.from("profiles").update({ avatar_url: path }).eq("id", authData.user.id);
    }

    if (authData.user) {
      await supabase.from("profiles").update({
        telefone: data.telefone || null,
        concurso_alvo: data.concurso_alvo || null,
      }).eq("id", authData.user.id);
    }

    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen grid md:grid-cols-2">
        <LeftPanel />
        <div className="flex flex-col justify-center items-center p-12 bg-bg">
          <div className="w-full max-w-[420px] text-center">
            <div className="text-5xl mb-5">✉️</div>
            <h2 className="font-bebas text-4xl tracking-widest mb-3">CONFIRME SEU E-MAIL</h2>
            <p className="text-muted leading-relaxed mb-7">
              Enviamos um link para{" "}
              <strong className="text-text-base">{getValues("email")}</strong>.
            </p>
            <button
              className="text-accent text-sm bg-transparent border-none cursor-pointer font-[inherit]"
              onClick={() => setSuccess(false)}
            >
              Não recebeu? Tente novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <LeftPanel />
      <div className="flex flex-col justify-center items-center p-12 bg-bg overflow-y-auto">
        <div className="w-full max-w-[420px]">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/25 text-accent px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase mb-4">
              🎯 Gratuito, sem cartão
            </div>
            <h1 className="font-bebas text-4xl tracking-widest mb-2">CRIE SUA CONTA</h1>
            <p className="text-muted text-sm">
              Já tem conta?{" "}
              <Link href="/login" className="text-accent font-semibold no-underline">
                Entrar
              </Link>
            </p>
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-4 mb-7">
            <div
              onClick={() => avatarInputRef.current?.click()}
              className="w-[72px] h-[72px] rounded-full bg-surface2 border-2 border-dashed border-border flex items-center justify-center cursor-pointer overflow-hidden flex-shrink-0 transition-colors hover:border-accent"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">👤</span>
              )}
            </div>
            <div>
              <div className="text-sm font-semibold mb-1">Foto de perfil</div>
              <div className="text-xs text-muted leading-snug">
                Sua foto aparece no ranking.<br />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="text-accent text-xs bg-transparent border-none cursor-pointer font-[inherit] p-0 underline"
                >
                  {avatarPreview ? "Trocar foto" : "Adicionar foto"}
                </button>
              </div>
            </div>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            {errors.root?.message && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3.5 py-3 text-[13px] text-red-400">
                {errors.root.message}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Nome" error={errors.nome?.message}>
                <Input {...register("nome")} placeholder="João" autoComplete="given-name" />
              </Field>
              <Field label="Sobrenome" error={errors.sobrenome?.message}>
                <Input {...register("sobrenome")} placeholder="Silva" autoComplete="family-name" />
              </Field>
            </div>

            <Field label="E-mail" error={errors.email?.message}>
              <Input {...register("email")} type="email" placeholder="joao@email.com" autoComplete="email" />
            </Field>

            <Field label="Senha" error={errors.senha?.message}>
              <div className="relative">
                <Input
                  {...register("senha")}
                  type={showSenha ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-base bg-transparent border-none cursor-pointer leading-none"
                  aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showSenha ? "🙈" : "👁️"}
                </button>
              </div>
            </Field>

            <Field label="Confirmar Senha" error={errors.confirmarSenha?.message}>
              <Input
                {...register("confirmarSenha")}
                type={showSenha ? "text" : "password"}
                placeholder="Repita a senha"
                autoComplete="new-password"
              />
            </Field>

            <div className="grid grid-cols-[1fr_90px] gap-3">
              <Field label="Cidade" error={errors.cidade?.message}>
                <Input {...register("cidade")} placeholder="Porto Alegre" autoComplete="address-level2" />
              </Field>
              <Field label="Estado" error={errors.estado?.message}>
                <Select onValueChange={(v) => setValue("estado", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_BR.map((uf) => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="border-t border-border pt-4">
              <div className="text-[11px] font-bold tracking-widest text-muted uppercase mb-3">
                Opcional
              </div>
              <div className="flex flex-col gap-3">
                <Field label="Telefone">
                  <Input {...register("telefone")} type="tel" placeholder="(51) 9 9999-9999" autoComplete="tel" />
                </Field>
                <Field label="Concurso alvo">
                  <Select onValueChange={(v) => setValue("concurso_alvo", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONCURSOS.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full mt-2">
              {isSubmitting ? "Criando conta…" : "Criar Conta Gratuita →"}
            </Button>

            <p className="text-[11px] text-muted text-center leading-relaxed">
              Ao criar uma conta, você concorda com os{" "}
              <Link href="/termos" className="text-muted underline">Termos de Uso</Link>{" "}
              e a{" "}
              <Link href="/privacidade" className="text-muted underline">Política de Privacidade</Link>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Rodar `npx tsc --noEmit` — sem erros.**

---

### Task 12: Migrar dashboard/page.tsx

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Substituir `src/app/dashboard/page.tsx` pelo conteúdo abaixo:**

```tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/app/components/StatCard";
import { LogoutButton } from "@/app/components/LogoutButton";
import { Logo } from "@/app/components/Logo";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login");

  const primeiroNome = profile.nome.split(" ")[0];
  const iniciais = `${profile.nome[0]}${profile.sobrenome[0]}`.toUpperCase();
  const isPremium = profile.plano === "premium";
  const hoje = new Date().toISOString().slice(0, 10);
  const streakAtiva = profile.streak_ultima_data === hoje;

  return (
    <div className="grid grid-cols-[240px_1fr] min-h-screen bg-bg font-sans">
      {/* ── Sidebar ── */}
      <aside className="bg-surface border-r border-border flex flex-col px-4 py-7 sticky top-0 h-screen overflow-y-auto">
        <Link href="/" className="block px-2 mb-9">
          <Logo size="md" />
        </Link>

        <nav className="flex flex-col gap-0.5 flex-1">
          {[
            { href: "/dashboard", icon: "⊞", label: "Início", active: true },
            { href: "/filtros", icon: "🎯", label: "Novo Simulado" },
            { href: "/estudar", icon: "📚", label: "Estudar" },
          ].map(({ href, icon, label, active }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium no-underline transition-all ${
                active
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:bg-surface2 hover:text-text-base"
              }`}
            >
              <span className="text-base w-5 text-center">{icon}</span>
              {label}
            </Link>
          ))}
          <Link
            href="/ranking"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-muted no-underline transition-all hover:bg-surface2 hover:text-text-base"
          >
            <span className="text-base w-5 text-center">🏆</span>
            Ranking
            {!isPremium && <span className="ml-auto text-[11px] opacity-60">🔒</span>}
          </Link>
        </nav>

        <div className="flex flex-col gap-3 pt-4 border-t border-border mt-4">
          {!isPremium && (
            <Link
              href="/checkout/premium"
              className="flex items-center gap-2.5 bg-accent/8 border border-accent/20 rounded-xl p-3 no-underline hover:bg-accent/14 transition-colors"
            >
              <span className="text-xl">⚡</span>
              <div>
                <div className="text-[13px] font-semibold text-accent">Ir para Premium</div>
                <div className="text-[11px] text-muted mt-px">Ranking + Estatísticas</div>
              </div>
            </Link>
          )}
          <Link
            href="/perfil"
            className="flex items-center gap-2.5 px-2 py-2.5 rounded-lg no-underline hover:bg-surface2 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-[13px] font-bold text-accent flex-shrink-0">
              {iniciais}
            </div>
            <div className="overflow-hidden">
              <div className="text-[13px] font-semibold text-text-base truncate">
                {profile.nome} {profile.sobrenome}
              </div>
              <div className="text-[11px] text-muted mt-px">
                {isPremium ? "⭐ Premium" : "Gratuito"}
              </div>
            </div>
          </Link>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="p-9 overflow-y-auto flex flex-col gap-8 max-w-[900px]">
        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="font-bebas text-3xl tracking-wide text-text-base">
              {saudacao()}, {primeiroNome} 👋
            </div>
            <div className="text-sm text-muted mt-0.5">
              {profile.concurso_alvo ? `Foco: ${profile.concurso_alvo}` : "Continue de onde parou"}
            </div>
          </div>
          <LogoutButton />
        </header>

        {/* Stats */}
        <section className="grid grid-cols-4 gap-4">
          <StatCard
            label="Pontuação total"
            value={profile.pontuacao.toLocaleString("pt-BR")}
            hint="+10 pts por acerto"
            accentValue
          />
          <StatCard
            label="Sequência"
            value={
              <span className="flex items-baseline gap-1.5">
                <span className="text-3xl">🔥</span>
                <span className={streakAtiva ? "text-accent" : ""}>
                  {profile.streak_dias} {profile.streak_dias === 1 ? "dia" : "dias"}
                </span>
              </span>
            }
            hint={streakAtiva ? "Você estudou hoje!" : "Estude hoje para não perder!"}
          />
          <StatCard
            label="Plano atual"
            value={<span className="text-xl mt-1">{isPremium ? "⭐ Premium" : "🆓 Gratuito"}</span>}
            hint={
              isPremium ? (
                "Acesso completo à plataforma"
              ) : (
                <Link href="/checkout/premium" className="text-accent no-underline">
                  Fazer upgrade →
                </Link>
              )
            }
          />
          <StatCard
            label="Localização"
            value={<span className="text-xl mt-1.5">{profile.cidade}</span>}
            hint={`${profile.estado} · Ranking local disponível`}
          />
        </section>

        {/* CTA */}
        <section>
          <div className="bg-surface border border-border rounded-2xl p-8 grid grid-cols-[1fr_auto] gap-10 items-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-accent/4" />
            <div>
              <div className="inline-flex items-center gap-1.5 bg-accent/10 border border-accent/25 text-accent px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase mb-3.5">
                🎯 Pronto para estudar?
              </div>
              <h2 className="font-bebas text-4xl tracking-wide text-text-base mb-2.5">
                COMECE UM SIMULADO AGORA
              </h2>
              <p className="text-sm text-muted leading-relaxed mb-5 max-w-[380px]">
                Escolha a banca, matéria e quantidade de questões. O sistema evita repetir o que você já acertou.
              </p>
              <div className="flex gap-3 flex-wrap">
                <Link href="/filtros" className="bg-accent text-bg px-6 py-3 rounded-lg font-bold text-sm no-underline hover:bg-accent2 transition-colors">
                  Montar simulado →
                </Link>
                <Link href="/estudar" className="bg-transparent text-text-base px-6 py-3 rounded-lg font-semibold text-sm border border-border no-underline hover:border-muted transition-colors">
                  Continuar estudo
                </Link>
              </div>
            </div>
            <div className="bg-surface2 border border-border rounded-xl px-5 py-4 min-w-[220px] flex flex-col gap-2.5">
              {[
                { dot: "bg-green", text: "Polícia Civil — Direito Penal" },
                { dot: "bg-accent", text: "CESPE · 20 questões · 30 min" },
                { dot: "bg-border", text: "Último: 14/20 acertos · +140 pts" },
              ].map(({ dot, text }) => (
                <div key={text} className="flex items-center gap-2 text-xs text-muted">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
                  {text}
                </div>
              ))}
              <div className="h-1 bg-border rounded-full mt-1">
                <div className="h-full bg-accent rounded-full w-[70%]" />
              </div>
            </div>
          </div>
        </section>

        {/* Histórico */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bebas text-2xl tracking-wide text-text-base">Simulados recentes</h3>
            <Link href="/estudar" className="text-sm text-accent no-underline font-medium">Ver todos →</Link>
          </div>
          <div className="bg-surface border border-border rounded-xl py-12 px-6 text-center">
            <div className="text-4xl mb-3">📋</div>
            <div className="text-base font-semibold text-text-base mb-1.5">Nenhum simulado ainda</div>
            <div className="text-sm text-muted mb-5">
              Seu histórico vai aparecer aqui depois do primeiro simulado.
            </div>
            <Link href="/filtros" className="bg-accent text-bg px-5 py-2.5 rounded-lg font-bold text-sm no-underline hover:bg-accent2 transition-colors inline-block">
              Fazer meu primeiro simulado →
            </Link>
          </div>
        </section>

        {/* Ranking bloqueado */}
        {!isPremium && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bebas text-2xl tracking-wide text-text-base">
                Ranking — {profile.cidade}
              </h3>
              <span className="text-[11px] font-bold text-muted bg-surface border border-border px-2.5 py-0.5 rounded-full">
                🔒 Premium
              </span>
            </div>
            <div className="relative bg-surface border border-border rounded-xl overflow-hidden">
              <div className="py-2 blur-sm pointer-events-none select-none">
                {["Ana O.", "Rafael S.", "Carla M."].map((nome, i) => (
                  <div key={nome} className="flex items-center gap-3 px-5 py-3 border-b border-border last:border-0">
                    <span className="font-bebas text-lg text-muted w-5">{i + 1}</span>
                    <div className="w-8 h-8 rounded-full bg-surface2 flex items-center justify-center text-xs font-semibold text-text-base">
                      {nome.split(" ").map((p) => p[0]).join("")}
                    </div>
                    <span className="flex-1 text-sm font-medium text-text-base">{nome}</span>
                    <span className="font-bebas text-base text-accent">
                      {(4280 - i * 330).toLocaleString("pt-BR")} pts
                    </span>
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-bg/60 backdrop-blur-sm">
                <div className="text-center text-text-base text-sm">
                  <div className="text-3xl mb-2.5">🏆</div>
                  <div className="font-semibold mb-1.5">Ranking disponível no Premium</div>
                  <Link href="/checkout/premium" className="bg-accent text-bg px-5 py-2.5 rounded-lg font-bold text-[13px] no-underline hover:bg-accent2 transition-colors inline-block">
                    Desbloquear →
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}
```

- [ ] **Rodar `npx tsc --noEmit` — sem erros.**

---

### Task 13: Migrar page.tsx (landing)

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Remover as duas linhas de import no topo de `src/app/page.tsx`:**

```tsx
// Remover estas duas linhas:
import './estudee.css';
// (já removido na task anterior, mas confirmar)
```

- [ ] **Substituir `src/app/page.tsx` pelo conteúdo abaixo:**

```tsx
'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/app/components/Logo';

export default function EstudeeLandingPage() {
  const router = useRouter();
  const nav = (path: string) => router.push(path);

  return (
    <>
      <nav className="flex items-center justify-between px-10 py-[18px] border-b border-border bg-bg/90 sticky top-0 z-50 backdrop-blur-[10px]">
        <Logo size="md" />
        <div className="flex gap-7 items-center">
          {['Recursos', 'Planos', 'Ranking', 'Suporte'].map((item) => (
            <Link key={item} href="#" className="text-muted no-underline text-sm font-medium hover:text-text-base transition-colors">
              {item}
            </Link>
          ))}
        </div>
        <div className="flex gap-2.5">
          <button
            className="bg-transparent text-text-base border border-border px-4 py-2 rounded-md text-sm font-semibold cursor-pointer hover:border-muted transition-colors"
            onClick={() => nav('/login')}
          >
            Entrar
          </button>
          <button
            className="bg-accent text-bg px-5 py-2 rounded-md text-sm font-semibold border-none cursor-pointer hover:bg-accent2 transition-colors"
            onClick={() => nav('/cadastro')}
          >
            Criar Conta
          </button>
        </div>
      </nav>

      <h2 className="sr-only">Estudee — plataforma de estudos gamificados para concursos públicos</h2>

      {/* Hero */}
      <div className="px-10 py-[90px] max-w-[1100px] mx-auto grid grid-cols-2 gap-[60px] items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-accent/12 border border-accent/30 text-accent px-3.5 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6 animate-pulse">
            🔥 Estudos Gamificados
          </div>
          <h1 className="font-bebas text-7xl leading-none tracking-wide text-text-base mb-5">
            ESTUDOS <span className="text-accent">RANKEADOS</span> ATÉ A SUA APROVAÇÃO
          </h1>
          <p className="text-muted text-base leading-[1.7] mb-8 max-w-[480px]">
            Simulados com questões reais de concursos públicos, sistema de pontuação e ranking nacional.
            Prepare-se do jeito certo — questão por questão.
          </p>
          <div className="flex gap-3.5 flex-wrap mb-10">
            <button
              className="bg-accent text-bg px-8 py-3.5 rounded-lg font-bold text-sm border-none cursor-pointer hover:bg-accent2 hover:-translate-y-px transition-all"
              onClick={() => nav('/comecar-gratis')}
            >
              Começar Gratuitamente
            </button>
            <button
              className="bg-transparent text-text-base px-8 py-3.5 rounded-lg font-semibold text-sm border border-border cursor-pointer hover:border-muted transition-colors"
              onClick={() => nav('/cadastro')}
            >
              Ver como funciona
            </button>
          </div>
          <div className="flex gap-8">
            {[
              { num: '50K+', label: 'Questões' },
              { num: '8+', label: 'Bancas' },
              { num: '3', label: 'Carreiras' },
            ].map(({ num, label }) => (
              <div key={label}>
                <div className="font-bebas text-4xl text-accent tracking-wide">{num}</div>
                <div className="text-xs text-muted uppercase tracking-wide">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Mockup */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          <div className="flex items-center gap-1.5 mb-4">
            <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
            <span className="w-3 h-3 rounded-full bg-[#28C840]" />
            <span className="text-xs text-muted ml-1.5">Simulado Polícia Civil — RS</span>
          </div>
          <div className="bg-surface2 rounded-xl p-4 mb-3">
            <p className="text-sm text-text-base leading-relaxed mb-3">
              Quanto à prisão em flagrante delito, é correto afirmar que qualquer pessoa <em>poderá</em> prender em flagrante quem estiver em situação de:
            </p>
            <div className="flex flex-col gap-1.5">
              <div className="text-xs px-3 py-2 rounded-lg bg-green/15 border border-green/30 text-green">A) Flagrante próprio, impróprio ou presumido ✓</div>
              {['B) Flagrante próprio apenas', 'C) Somente flagrante impróprio', 'D) Flagrante preparado'].map((opt) => (
                <div key={opt} className="text-xs px-3 py-2 rounded-lg bg-surface border border-border text-muted">{opt}</div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] text-muted">Questão 12 de 40</span>
            <span className="text-[11px] text-green font-semibold">+10 pts</span>
          </div>
          <div className="h-1.5 bg-surface2 rounded-full mb-3.5">
            <div className="h-full bg-accent rounded-full w-[30%]" />
          </div>
          <div className="flex items-center gap-2 bg-surface2 rounded-lg px-3 py-2.5">
            <span>🔥</span>
            <span className="text-xs text-muted flex-1">Sequência de estudos</span>
            <span className="text-xs font-bold text-accent">7 dias</span>
          </div>
        </div>
      </div>

      <div className="h-px bg-border mx-10" />

      {/* Como funciona */}
      <div className="px-10 py-20 max-w-[1100px] mx-auto">
        <div className="text-xs font-bold tracking-widest text-accent uppercase mb-2">Como funciona</div>
        <div className="font-bebas text-4xl tracking-wide text-text-base mb-10">PASSO-A-PASSO PARA O SEU NOME NO PÓDIO</div>
        <div className="grid grid-cols-4 gap-6">
          {[
            { n: 1, title: 'Crie sua conta', desc: 'Gratuito. Informe sua cidade, estado e concurso alvo' },
            { n: 2, title: 'Escolha os filtros', desc: 'Carreira, banca, matéria, cargo, estado e quantidade de questões' },
            { n: 3, title: 'Faça o simulado', desc: 'Responda as questões, veja o gabarito e acumule pontos' },
            { n: 4, title: 'Suba no ranking', desc: 'Compita com sua cidade, estado e o Brasil inteiro' },
          ].map(({ n, title, desc }) => (
            <div key={n} className="bg-surface border border-border rounded-xl p-5">
              <div className="font-bebas text-4xl text-accent mb-3">{n}</div>
              <h4 className="font-semibold text-text-base mb-1.5">{title}</h4>
              <p className="text-sm text-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="h-px bg-border mx-10" />

      {/* Features */}
      <div className="px-10 py-20 max-w-[1100px] mx-auto">
        <div className="text-xs font-bold tracking-widest text-accent uppercase mb-2">Recursos</div>
        <div className="font-bebas text-4xl tracking-wide text-text-base mb-2">TUDO QUE UM CONCURSEIRO PRECISA</div>
        <p className="text-muted text-sm mb-10">Da questão filtrada ao ranking nacional, a plataforma foi pensada para quem estuda de verdade.</p>
        <div className="grid grid-cols-3 gap-5">
          {[
            { icon: '🎯', title: 'Filtros Avançados', desc: 'Filtre por carreira, banca, matéria, cargo, estado e ano. O sistema evita repetir questões que você já acertou.' },
            { icon: '🏆', title: 'Ranking por Cidade', desc: 'Compete com quem é da sua cidade, do seu estado ou do Brasil inteiro. Veja onde você está no pódio.' },
            { icon: '🔥', title: 'Sequência de Estudos', desc: 'Mantenha sua ofensiva ativa. Cada dia de estudo conta — não deixe sua sequência quebrar.' },
            { icon: '📊', title: 'Estatísticas Detalhadas', desc: 'Veja seu desempenho por matéria, banca e período. Entenda onde precisa melhorar (recurso premium).' },
            { icon: '📋', title: 'Simulado de Concurso Real', desc: 'Reproduza uma prova que já aconteceu na ordem e condições originais, com cronômetro (recurso premium).' },
            { icon: '⚡', title: 'Pontuação Imediata', desc: '10 pontos por acerto, gabarito na hora ou ao final do simulado, você decide!' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-surface border border-border rounded-xl p-5">
              <div className="text-3xl mb-3">{icon}</div>
              <h3 className="font-semibold text-text-base mb-2">{title}</h3>
              <p className="text-sm text-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="h-px bg-border mx-10" />

      {/* Planos + Ranking */}
      <div className="px-10 py-20 max-w-[1100px] mx-auto">
        <div className="grid grid-cols-2 gap-[60px] items-start">
          <div>
            <div className="text-xs font-bold tracking-widest text-accent uppercase mb-2">Planos</div>
            <div className="font-bebas text-4xl tracking-wide text-text-base mb-2">ESCOLHA SEU PLANO</div>
            <p className="text-muted text-sm mb-8">A versão gratuita já é poderosa. O premium é para quem quer ir além.</p>
            <div className="grid grid-cols-2 gap-4">
              {/* Gratuito */}
              <div className="bg-surface border border-border rounded-xl p-5">
                <div className="font-semibold text-text-base mb-1">Gratuito</div>
                <div className="font-bebas text-3xl text-accent mb-4">R$0<span className="text-base text-muted font-sans">/mês</span></div>
                <ul className="flex flex-col gap-2 mb-5">
                  {['Simulados de até 40 questões', 'Pontuação e histórico', 'Filtros completos'].map((i) => (
                    <li key={i} className="text-xs text-muted flex items-center gap-1.5">✓ {i}</li>
                  ))}
                  {['Acesso ao ranking', 'Simulado cronometrado', 'Estatísticas avançadas'].map((i) => (
                    <li key={i} className="text-xs text-border flex items-center gap-1.5 line-through">✗ {i}</li>
                  ))}
                </ul>
                <button
                  className="w-full py-2.5 rounded-lg text-sm font-bold border border-border text-text-base bg-transparent cursor-pointer hover:border-muted transition-colors"
                  onClick={() => nav('/cadastro')}
                >
                  Criar conta grátis
                </button>
              </div>
              {/* Premium */}
              <div className="bg-surface border border-accent/40 rounded-xl p-5 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-bg text-[11px] font-bold px-3 py-0.5 rounded-full">Premium</div>
                <div className="font-semibold text-text-base mb-1">Premium</div>
                <div className="font-bebas text-3xl text-accent mb-4">R$49,90<span className="text-base text-muted font-sans">/mês</span></div>
                <ul className="flex flex-col gap-2 mb-5">
                  {['Simulados de até 100 questões', 'Acesso ao ranking nacional', 'Simulado de concurso real', 'Cronômetro no simulado', 'Estatísticas avançadas', 'Sem anúncios'].map((i) => (
                    <li key={i} className="text-xs text-muted flex items-center gap-1.5">✓ {i}</li>
                  ))}
                </ul>
                <button
                  className="w-full py-2.5 rounded-lg text-sm font-bold bg-accent text-bg border-none cursor-pointer hover:bg-accent2 transition-colors"
                  onClick={() => nav('/checkout/premium')}
                >
                  Assinar agora
                </button>
              </div>
            </div>
          </div>

          {/* Ranking preview */}
          <div>
            <div className="text-xs font-bold tracking-widest text-accent uppercase mb-2">Ranking</div>
            <div className="font-bebas text-4xl tracking-wide text-text-base mb-2">SEU LUGAR NO PÓDIO</div>
            <p className="text-sm text-muted mb-6">Veja onde você está entre os concurseiros da sua cidade, estado e do país.</p>
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <div className="flex gap-px bg-border">
                {['Cidade', 'Estado', 'Nacional'].map((tab, i) => (
                  <div
                    key={tab}
                    className={`flex-1 text-center py-2.5 text-xs font-semibold cursor-pointer ${i === 0 ? 'bg-surface text-accent' : 'bg-surface2 text-muted'}`}
                  >
                    {tab}
                  </div>
                ))}
              </div>
              {[
                { pos: 1, initials: 'AO', name: 'Ana O.', pts: 4280, gold: true },
                { pos: 2, initials: 'RS', name: 'Rafael S.', pts: 3950 },
                { pos: 3, initials: 'CM', name: 'Carla M.', pts: 3710 },
              ].map(({ pos, initials, name, pts, gold }) => (
                <div key={name} className="flex items-center gap-3 px-5 py-3 border-b border-border last:border-0">
                  <span className={`font-bebas text-lg w-5 ${gold ? 'text-accent' : 'text-muted'}`}>{pos}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${gold ? 'bg-accent/15 text-accent' : 'bg-surface2 text-text-base'}`}>{initials}</div>
                  <span className="flex-1 text-sm font-medium text-text-base">{name}</span>
                  <span className="font-bebas text-base text-accent">{pts.toLocaleString('pt-BR')} pts</span>
                </div>
              ))}
              <div className="flex items-center gap-3 px-5 py-3 opacity-50">
                <span className="font-bebas text-lg text-muted w-5">4</span>
                <div className="w-8 h-8 rounded-full bg-surface2 flex items-center justify-center text-xs font-semibold text-text-base">VL</div>
                <span className="flex-1 text-sm font-medium text-text-base">Você</span>
                <span className="font-bebas text-base text-muted">— pts</span>
              </div>
              <div className="text-center py-3 text-xs text-muted border-t border-border">
                🔒 Ranking disponível no plano Premium
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-border mx-10" />

      {/* Footer */}
      <footer className="px-10 py-16 max-w-[1100px] mx-auto">
        <div className="grid grid-cols-[1fr_auto_auto] gap-16 mb-10">
          <div>
            <Logo size="md" className="block mb-3" />
            <p className="text-sm text-muted leading-relaxed max-w-xs mb-4">
              Plataforma de simulados com questões reais de concursos públicos. Estude com mais inteligência, avance no ranking e conquiste sua aprovação.
            </p>
            <span className="text-xs text-muted border border-border rounded-full px-3 py-1">🏢 CNPJ: XX.XXX.XXX/0001-XX</span>
          </div>
          <div className="flex flex-col gap-2">
            <h5 className="text-xs font-bold uppercase tracking-widest text-muted mb-1">Plataforma</h5>
            {['Funcionalidades', 'Planos', 'Ranking', 'Criar conta'].map((l) => (
              <Link key={l} href="#" className="text-sm text-muted no-underline hover:text-text-base transition-colors">{l}</Link>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <h5 className="text-xs font-bold uppercase tracking-widest text-muted mb-1">Legal e Suporte</h5>
            {['Termos de Uso', 'Política de Privacidade', 'Política de Assinatura', 'Suporte', 'suporte@estudee.com.br'].map((l) => (
              <Link key={l} href="#" className="text-sm text-muted no-underline hover:text-text-base transition-colors">{l}</Link>
            ))}
          </div>
        </div>
        <div className="border-t border-border pt-8 flex items-start justify-between gap-8">
          <p className="text-xs text-muted leading-relaxed max-w-2xl">
            <strong className="text-text-base">Aviso legal:</strong> As questões disponibilizadas nesta plataforma são de autoria das respectivas bancas organizadoras e foram extraídas de provas públicas já aplicadas. A assinatura Premium concede acesso a <em>recursos adicionais da plataforma</em>. Os dados pessoais coletados são tratados nos termos da LGPD.
          </p>
          <div className="text-right flex-shrink-0 text-xs text-muted">
            <p>© 2025 Estudee Ltda.</p>
            <p>Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
```

- [ ] **Rodar `npx tsc --noEmit` — sem erros.**

---

### Task 14: Limpar arquivos CSS e imports obsoletos

**Files:**
- Delete: `src/app/estudee.css`
- Delete: `src/app/dashboard/dashboard.css`
- Verify: nenhum import restante para esses arquivos

- [ ] **Deletar `src/app/estudee.css`.**

- [ ] **Deletar `src/app/dashboard/dashboard.css`.**

- [ ] **Buscar por imports residuais e confirmar que não existe nenhum:**

```bash
# Deve retornar vazio:
grep -r "estudee.css" src/
grep -r "dashboard.css" src/
```

- [ ] **Rodar build completo:**

```bash
npm run build
```

Esperado: build finaliza sem erros. Warnings de tipo são aceitáveis; erros de compilação não.

- [ ] **Rodar `npm run dev` e verificar visualmente as 4 páginas:**
  - `/` — landing page
  - `/login` — página de login
  - `/cadastro` — página de cadastro
  - `/dashboard` — dashboard (requer login)
