'use client';

import Link from 'next/link';
import { Button } from '@/app/components/ui/button';

const beneficos = [
  'Ranking completo nacional e local',
  'Estatísticas avançadas por matéria',
  'Favoritos e histórico de desempenho',
  'Simulados sem limitações',
  'Acesso prioritário a novos recursos',
];

export default function PremiumCheckoutPage() {
  return (
    <main className="min-h-screen bg-bg px-4 py-8 md:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
              Upgrade
            </p>
            <h1 className="font-bebas text-4xl tracking-[0.08em] text-text-base md:text-5xl">
              Premium para evoluir
            </h1>
          </div>

          <Link
            href="/dashboard"
            className="w-fit rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted transition-colors hover:border-muted hover:text-text-base"
          >
            Voltar ao painel
          </Link>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl border border-border bg-surface p-6 md:p-8">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
              Plano premium
            </p>

            <div className="mb-6 flex items-end gap-3">
              <span className="text-5xl font-bold text-text-base">R$ 49,90</span>
              <span className="pb-2 text-sm text-muted">/ mês</span>
            </div>

            <ul className="space-y-3">
              {beneficos.map((beneficio) => (
                <li key={beneficio} className="flex items-center gap-3 text-text-base">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green text-xs font-bold text-bg">
                    ✓
                  </span>
                  <span>{beneficio}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-accent/40 bg-surface p-6">
            <h2 className="mb-5 text-xl font-semibold text-text-base">Resumo do pedido</h2>

            <div className="space-y-4 text-sm text-muted">
              <div className="flex items-center justify-between">
                <span>Plano</span>
                <span className="font-medium text-text-base">Premium</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Preço</span>
                <span className="font-medium text-text-base">R$ 49,90</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Tempo</span>
                <span className="font-medium text-text-base">1 mês</span>
              </div>
            </div>

            <div className="my-6 h-px bg-border" />

            <Button className="w-full bg-accent text-bg hover:bg-accent2">
              Confirmar pagamento
            </Button>

            <p className="mt-4 text-center text-xs text-muted">
              Pagamento simulado — fluxo de UX em desenvolvimento.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
