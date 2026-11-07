'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';

export default function ResetPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 md:p-8">
        {!submitted ? (
          <>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
              Segurança
            </p>
            <h1 className="mb-3 font-bebas text-4xl tracking-[0.08em] text-text-base">
              Redefinir senha
            </h1>
            <p className="mb-6 text-sm leading-6 text-muted">
              Crie uma nova senha para manter seu acesso seguro.
            </p>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-text-base">Nova senha</label>
                <input
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  className="w-full rounded-xl border border-border bg-bg/40 px-3 py-2.5 text-sm text-text-base outline-none transition-colors placeholder:text-muted focus:border-accent"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text-base">Confirmar senha</label>
                <input
                  type="password"
                  placeholder="Repita a nova senha"
                  className="w-full rounded-xl border border-border bg-bg/40 px-3 py-2.5 text-sm text-text-base outline-none transition-colors placeholder:text-muted focus:border-accent"
                />
              </div>

              <Button onClick={() => setSubmitted(true)} className="w-full bg-accent text-bg hover:bg-accent2">
                Salvar nova senha
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="mb-5 text-5xl">✅</div>
            <h2 className="mb-3 font-bebas text-4xl tracking-[0.08em] text-text-base">
              Senha atualizada
            </h2>
            <p className="mb-6 text-sm leading-6 text-muted">
              Sua senha foi redefinida com sucesso. Você pode entrar novamente agora.
            </p>

            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-bg transition-colors hover:bg-accent2"
            >
              Ir para login
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
