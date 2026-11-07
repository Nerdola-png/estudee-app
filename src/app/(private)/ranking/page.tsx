'use client';

import Link from 'next/link';
import { Button } from '@/app/components/ui/button';

const ranking = [
  { pos: 1, nome: 'Ana Ribeiro', pontos: 2360, cidade: 'Porto Alegre' },
  { pos: 2, nome: 'Carlos Souza', pontos: 2290, cidade: 'Florianópolis' },
  { pos: 3, nome: 'João Silva', pontos: 2140, cidade: 'Porto Alegre', destaque: true },
  { pos: 4, nome: 'Marta Costa', pontos: 2015, cidade: 'Caxias do Sul' },
  { pos: 5, nome: 'Thiago Alves', pontos: 1980, cidade: 'Pelotas' },
];

export default function RankingPage() {
  return (
    <main className="min-h-screen bg-bg px-4 py-8 md:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
              Ranking
            </p>
            <h1 className="font-bebas text-4xl tracking-[0.08em] text-text-base md:text-5xl">
              Top da semana
            </h1>
          </div>

          <Link
            href="/dashboard"
            className="w-fit rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted transition-colors hover:border-muted hover:text-text-base"
          >
            Voltar ao painel
          </Link>
        </header>

        <section className="mb-8 rounded-2xl border border-border bg-surface p-5 md:p-7">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-text-base">Porto Alegre</h2>
              <p className="text-sm text-muted">Seu ranking local</p>
            </div>
            <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
              Premium
            </span>
          </div>

          <div className="space-y-3">
            {ranking.map((item) => (
              <div
                key={item.pos}
                className={`flex items-center justify-between gap-4 rounded-xl border p-4 ${
                  item.destaque
                    ? 'border-accent/40 bg-accent/10'
                    : 'border-border bg-bg/40'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                      item.pos === 1
                        ? 'bg-accent text-bg'
                        : item.pos === 2
                          ? 'bg-surface2 text-text-base'
                          : item.pos === 3
                            ? 'bg-green text-bg'
                            : 'bg-surface2 text-text-base'
                    }`}
                  >
                    #{item.pos}
                  </div>

                  <div>
                    <p className="font-medium text-text-base">{item.nome}</p>
                    <p className="text-sm text-muted">{item.cidade}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold text-text-base">{item.pontos}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">pontos</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-end">
          <Button className="bg-accent text-bg hover:bg-accent2">
            Ver ranking nacional
          </Button>
        </div>
      </div>
    </main>
  );
}
