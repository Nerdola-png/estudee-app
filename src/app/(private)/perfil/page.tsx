'use client';

import Link from 'next/link';
import { Button } from '@/app/components/ui/button';

const metas = [
  { nome: 'Sequência de estudo', valor: '12 dias', status: 'Ativa' },
  { nome: 'Acertos na semana', valor: '78%', status: 'Em alta' },
  { nome: 'Questões respondidas', valor: '240', status: 'No total' },
];

const destaques = [
  { label: 'Concurso', valor: 'Polícia Civil - RS' },
  { label: 'Cidade', valor: 'Porto Alegre' },
  { label: 'Plano', valor: 'Premium' },
];

export default function PerfilPage() {
  return (
    <main className="min-h-screen bg-bg px-4 py-8 md:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
              Conta
            </p>
            <h1 className="font-bebas text-4xl tracking-[0.08em] text-text-base md:text-5xl">
              Meu perfil
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
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-2xl font-bold text-accent">
                JS
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-text-base">João Silva</h2>
                <p className="text-sm text-muted">joao.silva@email.com</p>
              </div>
            </div>

            <Button className="bg-accent text-bg hover:bg-accent2">
              Editar perfil
            </Button>
          </div>
        </section>

        <section className="mb-8 grid gap-4 md:grid-cols-3">
          {destaques.map((item) => (
            <div key={item.label} className="rounded-2xl border border-border bg-surface p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">{item.label}</p>
              <p className="mt-3 text-xl font-semibold text-text-base">{item.valor}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-border bg-surface p-5 md:p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-text-base">Metas e evolução</h3>
              <span className="rounded-full border border-border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
                Atualizado hoje
              </span>
            </div>

            <div className="space-y-4">
              {metas.map((meta) => (
                <div key={meta.nome} className="rounded-xl border border-border bg-bg/40 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="font-medium text-text-base">{meta.nome}</span>
                    <span className="text-xs uppercase tracking-[0.18em] text-accent">{meta.status}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-bg">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: meta.nome === 'Questões respondidas' ? '72%' : meta.nome === 'Acertos na semana' ? '78%' : '86%' }}
                    />
                  </div>
                  <div className="mt-2 text-right text-sm font-medium text-muted">{meta.valor}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5 md:p-6">
            <h3 className="mb-4 text-xl font-semibold text-text-base">Acesso</h3>

            <div className="space-y-3 text-sm text-muted">
              <div className="rounded-xl border border-border bg-bg/40 p-3">
                <p className="font-medium text-text-base">Plano atual</p>
                <p className="mt-1">Premium</p>
              </div>
              <div className="rounded-xl border border-border bg-bg/40 p-3">
                <p className="font-medium text-text-base">Último login</p>
                <p className="mt-1">Hoje às 08:42</p>
              </div>
              <div className="rounded-xl border border-border bg-bg/40 p-3">
                <p className="font-medium text-text-base">Preferência</p>
                <p className="mt-1">Direito Penal e Constitucional</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
