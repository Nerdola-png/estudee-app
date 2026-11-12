import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import RevisaoClient from './RevisaoClient';

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

export default async function RevisaoPage({
  searchParams,
}: {
  searchParams: Promise<{ sessao?: string }>;
}) {
  const { sessao: sessaoId } = await searchParams;

  if (!sessaoId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessaoId)) {
    return <SemRevisao motivo="Não encontramos uma sessão válida para esta conta." />;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: sessao, error } = await supabase
    .from('sessoes')
    .select('id')
    .eq('id', sessaoId)
    .eq('user_id', user.id)
    .single();

  if (error || !sessao) {
    return <SemRevisao motivo="Você não tem permissão para visualizar esta revisão." />;
  }

  return <RevisaoClient sessaoId={sessaoId} />;
}