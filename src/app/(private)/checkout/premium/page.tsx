import Link from 'next/link';

export default function PremiumCheckoutPage() {
  return (
    <main className="min-h-screen bg-bg px-4 py-8 md:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Plano</p>
            <h1 className="font-bebas text-4xl tracking-[0.08em] text-text-base md:text-5xl">Premium</h1>
          </div>
          <Link href="/dashboard" className="w-fit rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted transition-colors hover:border-muted hover:text-text-base">
            Voltar ao painel
          </Link>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-2xl border border-border bg-surface p-6 md:p-8">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">Acesso Premium</p>
            <h2 className="mb-6 font-bebas text-4xl tracking-wide text-text-base">PAGAMENTO POR PIX MANUAL</h2>
            <p className="text-sm leading-6 text-muted">
              O pagamento é combinado e confirmado manualmente com a equipe. Depois da confirmação, o acesso Premium é ativado no banco de dados.
            </p>
            <p className="mt-4 text-sm leading-6 text-muted">
              Esta página não inicia uma cobrança nem altera seu plano. A chave Pix, o valor e o prazo de acesso devem ser confirmados com a equipe antes do pagamento.
            </p>
          </div>

          <div className="rounded-2xl border border-accent/40 bg-surface p-6">
            <h2 className="mb-3 text-xl font-semibold text-text-base">Ainda não tem Premium?</h2>
            <p className="text-sm leading-6 text-muted">
              Fale com a equipe para receber os dados do Pix e as condições vigentes. Guarde o comprovante; a ativação acontece após a conferência.
            </p>
            <p className="mt-5 rounded-lg border border-border bg-bg/50 p-3 text-xs leading-5 text-muted">
              Nenhum pagamento é processado pelo aplicativo. O Premium não é ativado por redirecionamento ou ação do usuário.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
