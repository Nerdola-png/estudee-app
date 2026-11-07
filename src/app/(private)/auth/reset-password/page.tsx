'use client';

import { useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Field } from '@/app/components/Field';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import {
  updatePasswordSchema,
  type UpdatePasswordData,
} from '@/schema/login';

export default function ResetPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const supabase = createClient();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordData>({
    resolver: zodResolver(updatePasswordSchema),
  });

  const onSubmit = async (data: UpdatePasswordData) => {
    const { error } = await supabase.auth.updateUser({ password: data.senha });

    if (error) {
      setError('root', {
        message: 'Não foi possível atualizar a senha. Solicite um novo link e tente novamente.',
      });
      return;
    }

    setSubmitted(true);
  };

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

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <Field label="Nova senha" error={errors.senha?.message}>
                <Input
                  {...register('senha')}
                  type="password"
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                />
              </Field>

              <Field label="Confirmar senha" error={errors.confirmarSenha?.message}>
                <Input
                  {...register('confirmarSenha')}
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repita a nova senha"
                />
              </Field>

              {errors.root?.message && (
                <p role="alert" className="text-sm text-red-400">
                  {errors.root.message}
                </p>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-accent text-bg hover:bg-accent2"
              >
                {isSubmitting ? 'Salvando…' : 'Salvar nova senha'}
              </Button>
            </form>
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
