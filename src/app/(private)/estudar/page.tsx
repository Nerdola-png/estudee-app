import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import EstudarClient from './EstudarClient';

export default async function EstudarPage({
  searchParams,
}: {
  searchParams: Promise<{ sessao?: string }>;
}) {
  const { sessao: sessaoParam } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  if (!sessaoParam || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessaoParam)) {
    const { data: sessaoEmAndamento, error } = await supabase.rpc('obter_sessao_em_andamento');

    if (error) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-8">
          <div className="max-w-md rounded-xl border border-red-500/30 bg-surface p-6 text-center">
            <h1 className="mb-2 font-bebas text-4xl text-text-base">Não foi possível retomar seu simulado</h1>
            <p role="alert" className="mb-5 text-sm text-muted">Tente novamente ou inicie um novo simulado.</p>
            <Link href="/filtros" className="inline-flex rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-bg">
              Novo simulado
            </Link>
          </div>
        </main>
      );
    }

    if (sessaoEmAndamento) redirect(`/estudar?sessao=${encodeURIComponent(sessaoEmAndamento)}`);

    return (
      <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-8">
        <div className="max-w-md rounded-xl border border-border bg-surface p-6 text-center">
          <h1 className="mb-2 font-bebas text-4xl text-text-base">Simulado não encontrado</h1>
          <p className="mb-5 text-sm text-muted">Você não tem simulados em andamento. Inicie um novo para continuar.</p>
          <Link href="/filtros" className="inline-flex rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-bg">
            Novo simulado
          </Link>
        </div>
      </main>
    );
  }

  return <EstudarClient sessaoId={sessaoParam} />;
}
