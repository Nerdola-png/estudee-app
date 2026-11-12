import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PerfilClient } from './PerfilClient';

export default async function PerfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [perfilResult, planoResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id,nome,sobrenome,cidade,estado,telefone,concurso_alvo,avatar_url,nickname,ranking_opt_in,uf,municipio_ibge')
      .eq('id', user.id)
      .single(),
    supabase.rpc('plano_atual_usuario'),
  ]);

  if (perfilResult.error || planoResult.error) {
    return (
      <main className="min-h-screen bg-bg px-4 py-8 md:px-8 lg:px-10">
        <div className="mx-auto max-w-5xl rounded-2xl border border-red-500/30 bg-surface p-6">
          <h1 className="font-bebas text-4xl text-text-base">Não foi possível carregar seu perfil</h1>
          <p role="alert" className="mt-2 text-sm text-muted">Atualize a página e tente novamente.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg px-4 py-8 md:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Conta</p>
            <h1 className="font-bebas text-4xl tracking-[0.08em] text-text-base md:text-5xl">Meu perfil</h1>
          </div>
          <Link href="/dashboard" className="w-fit rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted transition-colors hover:border-muted hover:text-text-base">
            Voltar ao painel
          </Link>
        </header>

        <PerfilClient
          perfil={perfilResult.data}
          email={user.email ?? ''}
          plano={planoResult.data}
        />
      </div>
    </main>
  );
}
