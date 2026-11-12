'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { DadosPessoaisSection } from './sections/DadosPessoaisSection';
import { LocalizacaoSection } from './sections/LocalizacaoSection';
import { SegurancaSection } from './sections/SegurancaSection';
import { AvatarSection } from './sections/AvatarSection';
import { RankingSection } from './sections/RankingSection';
import { Button } from '@/app/components/ui/button';
import { useSalvarPerfil } from '@/hooks/use-perfil';
import { perfilSchema } from '@/schema/perfil';

type PerfilInicial = {
  id: string;
  nome: string;
  sobrenome: string;
  cidade: string;
  estado: string;
  telefone: string | null;
  concurso_alvo: string | null;
  avatar_url: string | null;
  nickname: string | null;
  ranking_opt_in: boolean;
  uf: string | null;
  municipio_ibge: string | null;
};

interface PerfilClientProps {
  perfil: PerfilInicial;
  email: string;
  plano: string;
}

export function PerfilClient({ perfil, email, plano }: PerfilClientProps) {
  const router = useRouter();
  const salvarPerfil = useSalvarPerfil(perfil.id);
  const [salvo, setSalvo] = useState(false);

  const methods = useForm({
    resolver: zodResolver(perfilSchema),
    defaultValues: {
      telefone: perfil.telefone ?? '',
      concurso_alvo: perfil.concurso_alvo ?? '',
      nickname: perfil.nickname ?? '',
      uf: perfil.uf ?? '',
      municipio_ibge: perfil.municipio_ibge ?? '',
      ranking_opt_in: perfil.ranking_opt_in,
    },
  });

  const { handleSubmit, formState } = methods;

  const onSubmit = async (data: NonNullable<typeof methods.formState.defaultValues>) => {
    setSalvo(false);

    try {
      await salvarPerfil.mutateAsync({
        telefone: data.telefone || null,
        concurso_alvo: data.concurso_alvo || null,
        nickname: data.nickname || null,
        ranking_opt_in: data.ranking_opt_in,
        uf: data.uf || null,
        municipio_ibge: data.municipio_ibge || null,
      });
      setSalvo(true);
      router.refresh();
    } catch (error) {
      // Erro é tratado pelo hook
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        {/* Mensagens de feedback */}
        {(salvarPerfil.error || formState.errors.root?.message) && (
          <div
            role="alert"
            className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
          >
            {salvarPerfil.error?.message ||
              formState.errors.root?.message ||
              'Não foi possível salvar as alterações. Tente novamente.'}
          </div>
        )}

        {salvo && (
          <div
            role="status"
            className="rounded-lg border border-green/30 bg-green/10 p-4 text-sm text-green"
          >
            Perfil atualizado com sucesso!
          </div>
        )}

        {/* Grid de seções */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(260px,0.7fr)]">
          {/* Coluna principal */}
          <div className="space-y-6">
            <AvatarSection
              avatarUrlInicial={perfil.avatar_url}
              userId={perfil.id}
              nomeCompleto={`${perfil.nome} ${perfil.sobrenome}`}
            />

            <DadosPessoaisSection
              telefoneInicial={perfil.telefone ?? ''}
              concursoAlvoInicial={perfil.concurso_alvo ?? ''}
            />

            <LocalizacaoSection
              ufInicial={perfil.uf ?? ''}
              municipioIbgeInicial={perfil.municipio_ibge ?? ''}
            />

            <RankingSection nicknameInicial={perfil.nickname ?? ''} />
          </div>

          {/* Coluna lateral */}
          <div className="space-y-4">
            <SegurancaSection emailAtual={email} userId={perfil.id} />

            {/* Card de conta */}
            <section className="rounded-2xl border border-border bg-surface p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                Conta
              </p>
              <h2 className="mt-3 text-xl font-semibold text-text-base">
                {perfil.nome} {perfil.sobrenome}
              </h2>
              <p className="mt-1 break-all text-sm text-muted">{email}</p>
            </section>

            {/* Card de plano */}
            <section className="rounded-2xl border border-border bg-surface p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                Plano atual
              </p>
              <p className="mt-3 text-xl font-semibold text-text-base">
                {plano === 'premium' ? 'Premium' : 'Gratuito'}
              </p>
              {plano !== 'premium' && (
                <a
                  href="/checkout/premium"
                  className="mt-3 inline-block text-sm font-medium text-accent underline"
                >
                  Ver benefícios Premium
                </a>
              )}
            </section>

            {/* Botão de salvar flutuante (mobile) */}
            <Button
              type="submit"
              disabled={formState.isSubmitting || salvarPerfil.isPending}
              className="w-full bg-accent text-bg hover:bg-accent2 lg:hidden"
            >
              {formState.isSubmitting || salvarPerfil.isPending
                ? 'Salvando…'
                : 'Salvar perfil'}
            </Button>
          </div>
        </div>

        {/* Botão de salvar (desktop) */}
        <div className="hidden lg:block">
          <Button
            type="submit"
            disabled={formState.isSubmitting || salvarPerfil.isPending}
            className="bg-accent text-bg hover:bg-accent2"
          >
            {formState.isSubmitting || salvarPerfil.isPending
              ? 'Salvando…'
              : 'Salvar perfil'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}