'use client';

import Link from 'next/link';
import { useFormContext } from 'react-hook-form';
import { Field } from '@/app/components/Field';
import { Input } from '@/app/components/ui/input';
import { type PerfilData } from '@/schema/perfil';

interface RankingSectionProps {
  nicknameInicial: string;
}

export function RankingSection({ nicknameInicial }: RankingSectionProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<PerfilData>();

  const rankingOptIn = watch('ranking_opt_in') ?? false;
  const municipioSelecionado = watch('municipio_ibge') ?? '';

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 md:p-7">
      <h2 className="mb-1 text-xl font-semibold text-text-base">Ranking</h2>
      <p className="mb-6 text-sm leading-6 text-muted">
        Configure como você aparece nos rankings nacional, estadual e municipal.
      </p>

      <div className="space-y-5">
        {/* Nickname */}
        <div>
          <Field label="Nickname" error={errors.nickname?.message}>
            <Input
              {...register('nickname')}
              placeholder="Ex.: estudioso_rs"
              autoComplete="nickname"
              maxLength={24}
              className="h-11"
            />
          </Field>
          <p className="-mt-3 text-xs text-muted">
            3 a 24 letras, números ou sublinhados. Este é o nome que aparece no
            ranking.
          </p>
        </div>

        {/* Participação no ranking */}
        <label className="flex items-start gap-3 rounded-xl border border-border bg-bg/40 p-4 text-sm text-text-base">
          <input
            {...register('ranking_opt_in')}
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
          />
          <span>
            Participar dos rankings nacional, estadual e municipal com meu
            nickname.
            <span className="mt-1 block text-xs text-muted">
              Você pode desativar a participação quando quiser. Consulte a{' '}
              <Link href="/privacidade" className="text-accent underline">
                política de privacidade
              </Link>
              .
            </span>
          </span>
        </label>

        {rankingOptIn && !municipioSelecionado && (
          <p className="text-xs text-muted">
            Selecione uma UF e um município na seção &quot;Localização&quot; para ativar
            a participação no ranking.
          </p>
        )}
      </div>
    </section>
  );
}