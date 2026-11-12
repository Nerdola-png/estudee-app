'use client';

import Link from 'next/link';
import { useRevisao } from '@/hooks/use-quiz';

function formatarTempo(segundos: number) {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segundosRestantes = segundos % 60;

  return horas > 0
    ? `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundosRestantes.toString().padStart(2, '0')}`
    : `${minutos.toString().padStart(2, '0')}:${segundosRestantes.toString().padStart(2, '0')}`;
}

function SemRevisao({ motivo }: { motivo: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-8">
      <div className="max-w-md rounded-xl border border-border bg-surface p-6 text-center">
        <h1 className="mb-2 font-bebas text-4xl text-text-base">Revisão indisponível</h1>
        <p role="alert" className="mb-5 text-sm text-muted">{motivo}</p>
        <Link href="/dashboard" className="inline-flex rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-bg">
          Voltar ao painel
        </Link>
      </div>
    </main>
  );
}

export default function RevisaoClient({ sessaoId }: { sessaoId: string }) {
  const { data: revisao, isPending, error } = useRevisao(sessaoId);

  if (isPending) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-8">
        <div className="rounded-xl border border-border bg-surface px-6 py-5 text-sm text-muted">
          Carregando revisão…
        </div>
      </main>
    );
  }

  if (error || !revisao) {
    return <SemRevisao motivo="Não foi possível carregar a revisão desta sessão." />;
  }

  const totalAcertos = revisao.questoes.filter((q) => q.acertou).length;
  const totalQuestoes = revisao.questoes.length;
  const percentual = Math.round((totalAcertos / totalQuestoes) * 100);

  return (
    <main className="min-h-screen bg-bg px-4 py-8 md:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Revisão</p>
            <h1 className="font-bebas text-4xl tracking-[0.08em] text-text-base md:text-5xl">
              Gabarito completo
            </h1>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/resultado?sessao=${encodeURIComponent(sessaoId)}`}
              className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-bg transition-colors hover:bg-accent2"
            >
              Ver desempenho
            </Link>
          </div>
        </header>

        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Acertos</p>
            <p className="mt-3 text-3xl font-bold text-text-base">{totalAcertos}/{totalQuestoes}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Percentual</p>
            <p className="mt-3 text-3xl font-bold text-accent">{percentual}%</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Questões</p>
            <p className="mt-3 text-3xl font-bold text-text-base">{totalQuestoes}</p>
          </div>
        </section>

        <div className="space-y-6">
          {revisao.questoes.map((questao, indice) => (
            <section
              key={questao.id}
              className="rounded-xl border border-border bg-surface p-5 md:p-7"
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
                  Questão {indice + 1} · {questao.materia}
                </p>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                  questao.acertou
                    ? 'bg-green/15 text-green'
                    : 'bg-red-500/15 text-red-400'
                }`}>
                  {questao.anulada && !questao.acertou
                    ? 'Anulada · acerto computado'
                    : questao.acertou
                      ? 'Acertou'
                      : `Errou · correta ${questao.gabarito}`}
                </span>
              </div>

              {questao.texto_base && (
                <div className="mb-4 rounded-lg border border-border bg-bg/40 p-4 md:p-5">
                  {questao.texto_base.titulo && (
                    <p className="mb-2 text-base font-semibold text-text-base">{questao.texto_base.titulo}</p>
                  )}
                  <p className="whitespace-pre-line text-base leading-7 text-text-base/90">
                    {questao.texto_base.conteudo}
                  </p>
                  {questao.texto_base.fonte && (
                    <p className="mt-3 text-xs text-muted">Fonte: {questao.texto_base.fonte}</p>
                  )}
                </div>
              )}

              <div className="mb-6 rounded-lg border border-border bg-bg/40 p-4">
                <p className="text-lg font-medium leading-8 text-text-base md:text-xl">
                  {questao.enunciado}
                </p>
              </div>

              <div className="space-y-3">
                {questao.alternativas.map((alternativa) => {
                  const selected = questao.resposta_usuario === alternativa.key;
                  const isGabarito = alternativa.key === questao.gabarito;

                  return (
                    <div
                      key={alternativa.key}
                      className={`flex items-start gap-3 rounded-lg border px-4 py-4 ${
                        selected && isGabarito
                          ? 'border-green bg-green/10'
                          : selected && !isGabarito
                            ? 'border-red-500/60 bg-red-500/10'
                            : isGabarito
                              ? 'border-green bg-green/5'
                              : 'border-border bg-bg/40'
                      }`}
                    >
                      <span className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold ${
                        selected && isGabarito
                          ? 'border-green bg-green text-bg'
                          : selected && !isGabarito
                            ? 'border-red-500 bg-red-500 text-bg'
                            : isGabarito
                              ? 'border-green bg-green text-bg'
                              : 'border-border bg-bg text-text-base'
                      }`}>
                        {alternativa.key}
                      </span>
                      <span className={`flex-1 leading-7 ${
                        selected && !isGabarito ? 'text-text-base/70' : 'text-text-base'
                      }`}>
                        {alternativa.texto}
                      </span>
                    </div>
                  );
                })}
              </div>

              {questao.justificativa && (
                <div className="mt-6 rounded-lg border border-border bg-bg/50 p-4">
                  <p className="mb-2 text-xs uppercase tracking-[0.18em] text-muted">Comentário</p>
                  <p className="text-sm leading-7 text-text-base">{questao.justificativa}</p>
                </div>
              )}
            </section>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link
            href={`/resultado?sessao=${encodeURIComponent(sessaoId)}`}
            className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-bg transition-colors hover:bg-accent2"
          >
            Ver desempenho detalhado
          </Link>
          <Link
            href="/filtros"
            className="inline-flex items-center justify-center rounded-lg border border-border px-5 py-3 text-sm font-medium text-text-base transition-colors hover:border-muted"
          >
            Fazer outro simulado
          </Link>
        </div>
      </div>
    </main>
  );
}