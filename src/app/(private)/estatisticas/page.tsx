'use client';

import Link from 'next/link';
import { Button } from '@/app/components/ui/button';

const estatisticas = [
  { nome: 'Direito Penal', percentual: 60, acertos: 3, total: 5 },
  { nome: 'Direito Constitucional', percentual: 80, acertos: 4, total: 5 },
  { nome: 'Português', percentual: 40, acertos: 2, total: 5 },
  { nome: 'Legislação de Trânsito', percentual: 100, acertos: 5, total: 5 },
];

export default function EstatisticasPage() {
  return (
    <main className="min-h-screen bg-bg px-4 py-8 md:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
              Estatísticas
            </p>
            <h1 className="font-bebas text-4xl tracking-[0.08em] text-text-base md:text-5xl">
              Desempenho por matéria
            </h1>
          </div>

          <Link
            href="/dashboard"
            className="w-fit rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted transition-colors hover:border-muted hover:text-text-base"
          >
            Voltar ao painel
          </Link>
        </header>

        <section className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Total</p>
            <p className="mt-3 text-3xl font-bold text-text-base">14</p>
            <p className="mt-1 text-sm text-muted">questões</p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Acertos</p>
            <p className="mt-3 text-3xl font-bold text-green">9</p>
            <p className="mt-1 text-sm text-muted">na última rodada</p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Média</p>
            <p className="mt-3 text-3xl font-bold text-accent">70%</p>
            <p className="mt-1 text-sm text-muted">acertos gerais</p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Foco</p>
            <p className="mt-3 text-2xl font-bold text-text-base">Penal</p>
            <p className="mt-1 text-sm text-muted">área mais forte</p>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5 md:p-7">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-text-base">Detalhamento</h2>
              <p className="text-sm text-muted">Comparativo por disciplina</p>
            </div>
            <span className="rounded-full border border-border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
              Atualizado
            </span>
          </div>

          <div className="space-y-4">
            {estatisticas.map((item) => (
              <div key={item.nome} className="rounded-xl border border-border bg-bg/40 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="font-medium text-text-base">{item.nome}</span>
                  <span className="text-sm text-muted">
                    {item.acertos}/{item.total}
                  </span>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-bg">
                  <div
                    className={`h-full rounded-full ${
                      item.percentual >= 80
                        ? 'bg-green'
                        : item.percentual >= 60
                          ? 'bg-accent'
                          : 'bg-red-500'
                    }`}
                    style={{ width: `${item.percentual}%` }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-sm text-muted">
                  <span>{item.percentual}% de acerto</span>
                  <span className="font-medium text-text-base">{item.percentual >= 60 ? 'Boa performance' : 'Revisar'}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-8 flex justify-end">
          <Button className="bg-accent text-bg hover:bg-accent2">Fazer novo simulado</Button>
        </div>
      </div>
    </main>
  );
}
