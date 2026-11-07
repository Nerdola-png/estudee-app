import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { LogoutButton } from '@/app/components/LogoutButton';
import { Logo } from '@/app/components/Logo';
import { StatCard } from '@/app/components/StatCard';
import { estatisticasSchema } from '@/schema/estatisticas';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [perfilResult, planoResult, estatisticasResult, sessaoEmAndamentoResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id,nome,sobrenome,cidade,estado,concurso_alvo,avatar_url,nickname,uf,municipio_ibge')
      .eq('id', user.id)
      .single(),
    supabase.rpc('plano_atual_usuario'),
    supabase.rpc('obter_estatisticas'),
    supabase.rpc('obter_sessao_em_andamento'),
  ]);

  if (perfilResult.error || planoResult.error || estatisticasResult.error || sessaoEmAndamentoResult.error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-8">
        <div className="max-w-lg rounded-2xl border border-red-500/30 bg-surface p-6">
          <h1 className="font-bebas text-4xl text-text-base">Não foi possível carregar o painel</h1>
          <p role="alert" className="mt-2 text-sm text-muted">
            Atualize a página. Seus simulados e respostas continuam salvos.
          </p>
        </div>
      </main>
    );
  }

  const parsedStats = estatisticasSchema.safeParse(estatisticasResult.data);
  if (!parsedStats.success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-8">
        <div className="max-w-lg rounded-2xl border border-red-500/30 bg-surface p-6">
          <h1 className="font-bebas text-4xl text-text-base">Painel temporariamente indisponível</h1>
          <p role="alert" className="mt-2 text-sm text-muted">Não foi possível validar os dados das estatísticas.</p>
        </div>
      </main>
    );
  }

  const profile = perfilResult.data;
  const stats = parsedStats.data;
  const isPremium = planoResult.data === 'premium';
  const primeiroNome = profile.nome.split(' ')[0];
  const iniciais = `${profile.nome[0] ?? ''}${profile.sobrenome[0] ?? ''}`.toUpperCase();

  return (
    <div className="grid min-h-screen grid-cols-1 bg-bg font-sans md:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="flex flex-col border-b border-border bg-surface px-4 py-4 md:sticky md:top-0 md:h-screen md:overflow-y-auto md:border-b-0 md:border-r md:py-7">
        <Link href="/" className="mb-9 block px-2">
          <Logo size="md" />
        </Link>

        <nav className="flex flex-1 flex-row gap-0.5 overflow-x-auto md:flex-col">
          {[
            { href: '/dashboard', icon: '⊞', label: 'Início' },
            { href: '/filtros', icon: '🎯', label: 'Novo simulado' },
            { href: '/estatisticas', icon: '📊', label: 'Estatísticas' },
            { href: '/ranking', icon: '🏆', label: 'Ranking' },
          ].map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-muted no-underline transition-all hover:bg-surface2 hover:text-text-base"
            >
              <span className="w-5 text-center text-base">{icon}</span>
              {label}
              {label === 'Ranking' && !isPremium && <span className="ml-auto text-[11px] opacity-60">🔒</span>}
            </Link>
          ))}
        </nav>

        {!isPremium && (
          <Link href="/checkout/premium" className="mt-4 flex items-center gap-2.5 rounded-xl border border-accent/20 bg-accent/8 p-3 no-underline transition-colors hover:bg-accent/14">
            <span className="text-xl">⚡</span>
            <span>
              <span className="block text-[13px] font-semibold text-accent">Conhecer Premium</span>
              <span className="mt-px block text-[11px] text-muted">Simulados maiores e ranking</span>
            </span>
          </Link>
        )}

        <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
          <Link href="/perfil" className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-2.5 no-underline hover:bg-surface2">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent/15 text-[13px] font-bold text-accent">
              {iniciais || 'U'}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold text-text-base">{profile.nome} {profile.sobrenome}</span>
              <span className="mt-px block text-[11px] text-muted">{isPremium ? 'Premium' : 'Gratuito'}</span>
            </span>
          </Link>
          <LogoutButton />
        </div>
      </aside>

      <main className="flex min-w-0 flex-col gap-6 overflow-y-auto p-4 sm:p-6 lg:gap-8 lg:p-9">
        <header>
          <p className="font-bebas text-3xl tracking-wide text-text-base">
            {saudacao()}, {primeiroNome}
          </p>
          <p className="mt-1 text-sm text-muted">
            {profile.concurso_alvo ? `Seu foco: ${profile.concurso_alvo}` : 'Um simulado de cada vez.'}
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Pontos acumulados" value={stats.resumo.pontos_total.toLocaleString('pt-BR')} hint="Somente simulados finalizados" accentValue />
          <StatCard label="Taxa de acerto" value={`${stats.resumo.percentual}%`} hint={`${stats.resumo.acertos} acertos no histórico`} />
          <StatCard label="Questões respondidas" value={stats.resumo.questoes.toLocaleString('pt-BR')} hint={`${stats.resumo.sessoes} simulados finalizados`} />
          <StatCard label="Plano atual" value={<span className="mt-1 text-xl">{isPremium ? 'Premium' : 'Gratuito'}</span>} hint={isPremium ? 'Ranking completo disponível' : 'Ranking completo é Premium'} />
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="rounded-2xl border border-border bg-surface p-5 sm:p-7">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">Próximo passo</p>
            <h2 className="font-bebas text-4xl tracking-wide text-text-base">
              {sessaoEmAndamentoResult.data ? 'CONTINUE SEU SIMULADO' : 'COMECE UM SIMULADO'}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
              {sessaoEmAndamentoResult.data
                ? 'Seu progresso está salvo. Retome de onde parou.'
                : 'Escolha a banca e as matérias. Ao final, veja sua pontuação e onde vale a pena reforçar os estudos.'}
            </p>
            <Link
              href={sessaoEmAndamentoResult.data
                ? `/estudar?sessao=${encodeURIComponent(sessaoEmAndamentoResult.data)}`
                : '/filtros'}
              className="mt-5 inline-flex rounded-lg bg-accent px-6 py-3 text-sm font-bold text-bg no-underline transition-colors hover:bg-accent2"
            >
              {sessaoEmAndamentoResult.data ? 'Retomar simulado' : 'Montar simulado'}
            </Link>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">Localização do perfil</p>
            <p className="mt-3 text-xl font-semibold text-text-base">{profile.cidade || 'Cidade não informada'}</p>
            <p className="mt-1 text-sm text-muted">{profile.uf ?? profile.estado ?? 'UF não informada'}</p>
            <Link href="/perfil" className="mt-4 inline-flex text-sm font-medium text-accent underline">
              Atualizar perfil
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5 sm:p-7">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-bebas text-2xl tracking-wide text-text-base">Simulados recentes</h2>
            <Link href="/estatisticas" className="text-sm font-medium text-accent no-underline">Ver estatísticas</Link>
          </div>
          {stats.sessoes_recentes.length === 0 ? (
            <div className="py-8 text-center">
              <p className="font-medium text-text-base">Nenhum simulado finalizado ainda</p>
              <p className="mt-1 text-sm text-muted">Seu histórico aparece aqui depois do primeiro resultado.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {stats.sessoes_recentes.map((sessao) => (
                <li key={sessao.sessao_id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium text-text-base">
                      {sessao.acertos}/{sessao.total_questoes} acertos · {sessao.pontos.toLocaleString('pt-BR')} pontos
                    </p>
                    <p className="text-xs text-muted">
                      {sessao.finalizada_em
                        ? new Date(sessao.finalizada_em).toLocaleDateString('pt-BR')
                        : 'Data não disponível'}
                    </p>
                  </div>
                  <Link href={`/resultado?sessao=${encodeURIComponent(sessao.sessao_id)}`} className="text-sm font-medium text-accent underline">
                    Ver resultado
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {!isPremium && (
          <section className="rounded-2xl border border-accent/30 bg-accent/5 p-5 sm:p-7">
            <h2 className="text-xl font-semibold text-text-base">Acompanhe o ranking completo</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Seus acertos inéditos já acumulam pontos. O plano Premium libera a lista nacional, estadual e municipal.
            </p>
            <Link href="/checkout/premium" className="mt-4 inline-flex text-sm font-semibold text-accent underline">
              Conhecer o plano Premium
            </Link>
          </section>
        )}
      </main>
    </div>
  );
}

function saudacao() {
  const hora = new Date().getHours();
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}
