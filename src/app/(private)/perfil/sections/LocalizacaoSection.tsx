'use client';

import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Field } from '@/app/components/Field';
import { useMunicipiosIBGE } from '@/hooks/use-perfil';
import { type PerfilData } from '@/schema/perfil';

const estados = [
  ['AC', 'Acre'],
  ['AL', 'Alagoas'],
  ['AP', 'Amapá'],
  ['AM', 'Amazonas'],
  ['BA', 'Bahia'],
  ['CE', 'Ceará'],
  ['DF', 'Distrito Federal'],
  ['ES', 'Espírito Santo'],
  ['GO', 'Goiás'],
  ['MA', 'Maranhão'],
  ['MT', 'Mato Grosso'],
  ['MS', 'Mato Grosso do Sul'],
  ['MG', 'Minas Gerais'],
  ['PA', 'Pará'],
  ['PB', 'Paraíba'],
  ['PR', 'Paraná'],
  ['PE', 'Pernambuco'],
  ['PI', 'Piauí'],
  ['RJ', 'Rio de Janeiro'],
  ['RN', 'Rio Grande do Norte'],
  ['RS', 'Rio Grande do Sul'],
  ['RO', 'Rondônia'],
  ['RR', 'Roraima'],
  ['SC', 'Santa Catarina'],
  ['SP', 'São Paulo'],
  ['SE', 'Sergipe'],
  ['TO', 'Tocantins'],
];

interface LocalizacaoSectionProps {
  ufInicial: string;
  municipioIbgeInicial: string;
}

export function LocalizacaoSection({
  ufInicial,
  municipioIbgeInicial,
}: LocalizacaoSectionProps) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<PerfilData>();

  const uf = watch('uf') ?? ufInicial;
  const municipioSelecionado = watch('municipio_ibge') ?? municipioIbgeInicial;

  const municipios = useMunicipiosIBGE(uf);

  // Limpar município quando UF mudar para evitar incompatibilidade
  const handleUfChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const novaUf = e.target.value;
    setValue('uf', novaUf);
    setValue('municipio_ibge', '', { shouldValidate: true });
  };

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 md:p-7">
      <h2 className="mb-1 text-xl font-semibold text-text-base">Localização</h2>
      <p className="mb-6 text-sm leading-6 text-muted">
        Informe sua localização para participar dos rankings estaduais e municipais.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Estado" error={errors.uf?.message}>
          <select
            {...register('uf')}
            onChange={handleUfChange}
            className="h-11 w-full rounded-xl border border-border bg-bg/60 px-3 text-sm text-text-base outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <option value="">Selecione a UF</option>
            {estados.map(([sigla, nome]) => (
              <option key={sigla} value={sigla}>
                {nome}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Município (IBGE)" error={errors.municipio_ibge?.message}>
          <select
            {...register('municipio_ibge')}
            disabled={!uf || municipios.isPending || Boolean(municipios.error)}
            className="h-11 w-full rounded-xl border border-border bg-bg/60 px-3 text-sm text-text-base outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
          >
            <option value="">
              {!uf
                ? 'Selecione primeiro a UF'
                : municipios.isPending
                  ? 'Carregando municípios…'
                  : 'Selecione o município'}
            </option>
            {municipios.data?.map((item) => (
              <option key={item.id} value={String(item.id)}>
                {item.nome}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {municipios.error && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
        >
          Não foi possível carregar os municípios do IBGE.{' '}
          <button
            type="button"
            onClick={() => void municipios.refetch()}
            className="underline"
          >
            Tentar novamente
          </button>
        </div>
      )}

      <p className="mt-4 text-xs text-muted">
        A lista de municípios é carregada automaticamente do IBGE. Selecione o
        município correto para participar dos rankings locais.
      </p>
    </section>
  );
}