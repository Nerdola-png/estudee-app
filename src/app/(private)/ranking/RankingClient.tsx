'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMinhaPosicao, useRanking } from '@/hooks/use-quiz';

const escopos = [
  { id: 'nacional', label: 'Nacional' },
  { id: 'estadual', label: 'Estadual' },
  { id: 'municipal', label: 'Municipal' },
] as const;

const periodos = [
  { id: 'semanal', label: 'Esta semana' },
  { id: 'mensal', label: 'Este mês' },
  { id: 'geral', label: 'Geral' },
] as const;

export function RankingClient({
  premium,
  participa,
  temUf,
  temMunicipio,
}: {
  premium: boolean;
  participa: boolean;
  temUf: boolean;
  temMunicipio: boolean;
}) {
  const [escopo, setEscopo] = useState<(typeof escopos)[number]['id']>('nacional');
  const [periodo, setPeriodo] = useState<(typeof periodos)[number]['id']>('semanal');
  const ranking = useRanking(escopo, periodo, premium);
  const minhaPosicao = useMinhaPosicao(escopo, periodo, !premium && participa);
  const localizacaoAusente = escopo === 'estadual' ? !temUf : escopo === 'municipal' ? !temMunicipio : false;

  const selecionarEscopo = (novoEscopo: (typeof escopos)[number]['id']) => {
    setEscopo(novoEscopo);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-surface p-5 md:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text-base">Onde você quer comparar?</h2>
            <p className="mt-1 text-sm text-muted">A classificação considera pontos de questões acertadas pela primeira vez.</p>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Período do ranking">
            {periodos.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={periodo === item.id}
                onClick={() => setPeriodo(item.id)}
                className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                  periodo === item.id ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:text-text-base'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2" aria-label="Escopo do ranking">
          {escopos.map((item) => {
            const disabled = item.id === 'estadual' ? !temUf : item.id === 'municipal' ? !temMunicipio : false;

            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={escopo === item.id}
                disabled={disabled}
                onClick={() => selecionarEscopo(item.id)}
                className={`rounded-lg border px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  escopo === item.id ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:text-text-base'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </section>

      {localizacaoAusente && (
        <section className="rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm text-accent">
          Complete sua localização para consultar este escopo.{' '}
          <Link href="/perfil" className="font-semibold underline">Atualizar perfil</Link>
        </section>
      )}

      {!participa && (
        <section className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
          Sua participação está desativada. Para aparecer no ranking, ative a opção no{' '}
          <Link href="/perfil" className="font-semibold text-accent underline">perfil</Link>.
        </section>
      )}

      {!premium ? (
        <section className="rounded-2xl border border-accent/30 bg-surface p-6 md:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">Acesso Premium</p>
          <h2 className="mt-2 text-2xl font-semibold text-text-base">Seus pontos já contam</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            O ranking completo é reservado ao Premium. A posição é exibida somente para quem optou por participar.
          </p>
          {participa && !localizacaoAusente && (
            <div className="mt-5 rounded-xl border border-border bg-bg/50 p-4">
              {minhaPosicao.isPending ? (
                <p className="text-sm text-muted">Calculando sua posição…</p>
              ) : minhaPosicao.error ? (
                <p role="alert" className="text-sm text-red-400">Não foi possível carregar sua posição. Tente novamente.</p>
              ) : minhaPosicao.data?.posicao ? (
                <>
                  <p className="text-sm text-muted">Sua posição {escopos.find((item) => item.id === escopo)?.label.toLowerCase()} · {periodos.find((item) => item.id === periodo)?.label.toLowerCase()}</p>
                  <p className="mt-1 text-2xl font-bold text-text-base">#{minhaPosicao.data.posicao}</p>
                  <p className="mt-1 text-sm text-muted">{minhaPosicao.data.pontos?.toLocaleString('pt-BR') ?? 0} pontos</p>
                </>
              ) : (
                <p className="text-sm text-muted">Finalize simulados com questões inéditas para aparecer na classificação.</p>
              )}
            </div>
          )}
          <Link href="/checkout/premium" className="mt-5 inline-flex rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-bg no-underline hover:bg-accent2">
            Conhecer o plano Premium
          </Link>
        </section>
      ) : localizacaoAusente ? null : (
        <section className="rounded-2xl border border-border bg-surface p-5 md:p-7">
          {ranking.isPending ? (
            <p className="py-8 text-center text-sm text-muted">Carregando classificação…</p>
          ) : ranking.error ? (
            <p role="alert" className="py-8 text-center text-sm text-red-400">
              Não foi possível carregar o ranking. Confira sua localização e tente novamente.
            </p>
          ) : ranking.data?.ranking.length === 0 ? (
            <div className="py-8 text-center">
              <h2 className="font-semibold text-text-base">Ainda não há participantes neste recorte</h2>
              <p className="mt-2 text-sm text-muted">Responda questões e convide colegas para construir a classificação.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ranking.data?.ranking.map((item) => (
                <div key={`${item.posicao}-${item.nickname ?? 'sem-nickname'}`} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-bg/40 p-4">
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="w-10 flex-shrink-0 text-center font-bebas text-2xl text-accent">#{item.posicao}</span>
                    <span className="truncate font-medium text-text-base">{item.nickname ?? 'Estudante'}</span>
                  </div>
                  <span className="flex-shrink-0 text-right">
                    <span className="block font-semibold text-text-base">{item.pontos.toLocaleString('pt-BR')}</span>
                    <span className="text-[10px] uppercase tracking-[0.16em] text-muted">pontos</span>
                  </span>
                </div>
              ))}
              {ranking.data?.minha_posicao.posicao && (
                <p className="pt-2 text-right text-sm text-muted">
                  Sua posição: <strong className="text-text-base">#{ranking.data.minha_posicao.posicao}</strong>
                </p>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
