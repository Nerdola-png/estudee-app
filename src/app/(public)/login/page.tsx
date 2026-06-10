"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Field } from "@/app/components/Field";
import { LeftPanel } from "@/app/components/LeftPanel";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import {
  loginSchema,
  resetSchema,
  type LoginData,
  type ResetData,
} from "@/schema/login";

// ── Page ─────────────────────────────────────────────────────────────────
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-bg text-muted text-sm">
          Carregando…
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
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
              <Button
                type="submit"
                disabled={resetForm.formState.isSubmitting}
                className="w-full bg-accent text-bg font-bold hover:bg-accent2"
              >
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
              className="w-full mt-2 bg-accent text-bg font-bold hover:bg-accent2"
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
