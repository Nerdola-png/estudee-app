import Link from 'next/link';
import EstudarClient from './EstudarClient';

export default async function EstudarPage({
  searchParams,
}: {
  searchParams: Promise<{ sessao?: string }>;
}) {
  const { sessao } = await searchParams;

  if (!sessao || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessao)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-8">
        <div className="max-w-md rounded-xl border border-border bg-surface p-6 text-center">
          <h1 className="mb-2 font-bebas text-4xl text-text-base">Simulado não encontrado</h1>
          <p className="mb-5 text-sm text-muted">Inicie um simulado pelos filtros para continuar.</p>
          <Link href="/filtros" className="inline-flex rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-bg">
            Ir para filtros
          </Link>
        </div>
      </main>
    );
  }

  return <EstudarClient sessaoId={sessao} />;
}
