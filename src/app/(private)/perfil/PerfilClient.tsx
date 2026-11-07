'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { Field } from '@/app/components/Field';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { useMunicipiosIBGE, useSalvarPerfil } from '@/hooks/use-perfil';
import { perfilSchema, type PerfilData } from '@/schema/perfil';

const estados = [
  ['AC', 'Acre'], ['AL', 'Alagoas'], ['AP', 'Amapá'], ['AM', 'Amazonas'],
  ['BA', 'Bahia'], ['CE', 'Ceará'], ['DF', 'Distrito Federal'], ['ES', 'Espírito Santo'],
  ['GO', 'Goiás'], ['MA', 'Maranhão'], ['MT', 'Mato Grosso'], ['MS', 'Mato Grosso do Sul'],
  ['MG', 'Minas Gerais'], ['PA', 'Pará'], ['PB', 'Paraíba'], ['PR', 'Paraná'],
  ['PE', 'Pernambuco'], ['PI', 'Piauí'], ['RJ', 'Rio de Janeiro'], ['RN', 'Rio Grande do Norte'],
  ['RS', 'Rio Grande do Sul'], ['RO', 'Rondônia'], ['RR', 'Roraima'], ['SC', 'Santa Catarina'],
  ['SP', 'São Paulo'], ['SE', 'Sergipe'], ['TO', 'Tocantins'],
];

type PerfilInicial = {
  id: string;
  nome: string;
  sobrenome: string;
  cidade: string;
  estado: string;
  nickname: string | null;
  ranking_opt_in: boolean;
  uf: string | null;
  municipio_ibge: string | null;
};

export function PerfilClient({
  perfil,
  email,
  plano,
}: {
  perfil: PerfilInicial;
  email: string;
  plano: string;
}) {
  const router = useRouter();
  const salvarPerfil = useSalvarPerfil(perfil.id);
  const [salvo, setSalvo] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PerfilData>({
    resolver: zodResolver(perfilSchema),
    defaultValues: {
      nickname: perfil.nickname ?? '',
      uf: perfil.uf ?? '',
      municipio_ibge: perfil.municipio_ibge ?? '',
      ranking_opt_in: perfil.ranking_opt_in,
    },
  });

  const uf = useWatch({ control, name: 'uf' }) ?? '';
  const municipios = useMunicipiosIBGE(uf);
  const rankingOptIn = useWatch({ control, name: 'ranking_opt_in' }) ?? false;
  const municipioSelecionado = useWatch({ control, name: 'municipio_ibge' }) ?? '';

  const onSubmit = async (data: PerfilData) => {
    setSalvo(false);
    const municipio = municipios.data?.find((item) => String(item.id) === data.municipio_ibge);

    if (data.municipio_ibge && !municipio) {
      setError('municipio_ibge', { message: 'Escolha um município carregado pela lista do IBGE.' });
      return;
    }

    try {
      await salvarPerfil.mutateAsync({
        nickname: data.nickname || null,
        ranking_opt_in: data.ranking_opt_in,
        uf: data.uf || null,
        municipio_ibge: data.municipio_ibge || null,
        ...(municipio ? { cidade: municipio.nome, estado: data.uf } : {}),
      });
      setSalvo(true);
      router.refresh();
    } catch (error) {
      setError('root', {
        message: error instanceof Error ? error.message : 'Não foi possível salvar seu perfil.',
      });
    }
  };

  const ufField = register('uf');

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(260px,0.7fr)]">
      <section className="rounded-2xl border border-border bg-surface p-5 md:p-7">
        <h2 className="mb-1 text-xl font-semibold text-text-base">Dados para o ranking</h2>
        <p className="mb-6 text-sm leading-6 text-muted">
          Sua participação é opcional. Se ativar, o ranking mostra apenas seu nickname e sua pontuação.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {errors.root?.message && (
            <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              {errors.root.message}
            </p>
          )}
          {salvarPerfil.error && !errors.root?.message && (
            <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              Não foi possível salvar as alterações. Tente novamente.
            </p>
          )}
          {salvo && (
            <p role="status" className="rounded-lg border border-green/30 bg-green/10 p-3 text-sm text-green">
              Perfil atualizado.
            </p>
          )}

          <Field label="Nickname" error={errors.nickname?.message}>
            <Input {...register('nickname')} placeholder="Ex.: estudioso_rs" autoComplete="nickname" maxLength={24} />
          </Field>
          <p className="-mt-3 text-xs text-muted">3 a 24 letras, números ou sublinhados.</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Estado" error={errors.uf?.message}>
              <select
                {...ufField}
                onChange={(event) => {
                  void ufField.onChange(event);
                  setValue('municipio_ibge', '', { shouldValidate: true });
                }}
                className="h-11 w-full rounded-xl border border-border bg-bg/60 px-3 text-sm text-text-base outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <option value="">Selecione a UF</option>
                {estados.map(([sigla, nome]) => <option key={sigla} value={sigla}>{nome}</option>)}
              </select>
            </Field>
            <Field label="Município (IBGE)" error={errors.municipio_ibge?.message}>
              <select
                {...register('municipio_ibge')}
                disabled={!uf || municipios.isPending || Boolean(municipios.error)}
                className="h-11 w-full rounded-xl border border-border bg-bg/60 px-3 text-sm text-text-base outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
              >
                <option value="">
                  {!uf ? 'Selecione primeiro a UF' : municipios.isPending ? 'Carregando municípios…' : 'Selecione o município'}
                </option>
                {municipios.data?.map((item) => (
                  <option key={item.id} value={String(item.id)}>{item.nome}</option>
                ))}
              </select>
            </Field>
          </div>

          {municipios.error && (
            <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              Não foi possível carregar os municípios do IBGE.{' '}
              <button type="button" onClick={() => void municipios.refetch()} className="underline">
                Tentar novamente
              </button>
            </div>
          )}

          <label className="flex items-start gap-3 rounded-xl border border-border bg-bg/40 p-4 text-sm text-text-base">
            <input
              {...register('ranking_opt_in')}
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
            />
            <span>
              Participar dos rankings nacional, estadual e municipal com meu nickname.
              <span className="mt-1 block text-xs text-muted">
                Você pode desativar a participação quando quiser. Consulte a{' '}
                <Link href="/privacidade" className="text-accent underline">política de privacidade</Link>.
              </span>
            </span>
          </label>

          {rankingOptIn && !municipioSelecionado && (
            <p className="text-xs text-muted">Selecione uma UF e um município para ativar a participação no ranking.</p>
          )}

          <Button type="submit" disabled={isSubmitting || salvarPerfil.isPending} className="bg-accent text-bg hover:bg-accent2">
            {isSubmitting || salvarPerfil.isPending ? 'Salvando…' : 'Salvar perfil'}
          </Button>
        </form>
      </section>

      <aside className="space-y-4">
        <section className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Conta</p>
          <h2 className="mt-3 text-xl font-semibold text-text-base">{perfil.nome} {perfil.sobrenome}</h2>
          <p className="mt-1 break-all text-sm text-muted">{email}</p>
        </section>
        <section className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Plano atual</p>
          <p className="mt-3 text-xl font-semibold text-text-base">{plano === 'premium' ? 'Premium' : 'Gratuito'}</p>
          {plano !== 'premium' && (
            <Link href="/checkout/premium" className="mt-3 inline-flex text-sm font-medium text-accent underline">
              Ver benefícios Premium
            </Link>
          )}
        </section>
      </aside>
    </div>
  );
}
