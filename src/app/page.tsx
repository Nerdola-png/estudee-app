import Link from 'next/link';
import { Logo } from '@/app/components/Logo';

export default function EstudeeLandingPage() {
  return (
    <>
      <nav className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-border bg-bg/90 px-4 py-3 backdrop-blur-[10px] sm:px-8 sm:py-[18px] lg:px-10">
        <Logo size="md" />
        <div className="hidden items-center gap-7 md:flex">
          {[
            { label: 'Recursos', href: '#recursos' },
            { label: 'Planos', href: '#planos' },
            { label: 'Ranking', href: '#ranking' },
            { label: 'Privacidade', href: '/privacidade' },
          ].map((item) => (
            <Link key={item.label} href={item.href} className="text-muted no-underline text-sm font-medium hover:text-text-base transition-colors">
              {item.label}
            </Link>
          ))}
        </div>
        <div className="ml-auto flex gap-2 sm:ml-0 sm:gap-2.5">
          <Link
            href="/login"
            className="bg-transparent text-text-base border border-border px-4 py-2 rounded-md text-sm font-semibold cursor-pointer hover:border-muted transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="bg-accent text-bg px-3 py-2 rounded-md text-xs font-semibold border-none cursor-pointer hover:bg-accent2 transition-colors sm:px-5 sm:text-sm"
          >
            Criar Conta
          </Link>
        </div>
      </nav>

      <h2 className="sr-only">Estudee — questões comentadas para concursos públicos</h2>

      {/* Hero */}
      <div className="mx-auto grid max-w-[1100px] grid-cols-1 items-center gap-8 px-4 py-12 sm:gap-10 sm:px-8 sm:py-16 lg:grid-cols-2 lg:gap-[60px] lg:px-10 lg:py-[90px]">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/12 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-accent sm:mb-6 sm:text-xs">
            Questões comentadas para concursos públicos
          </div>
          <h1 className="mb-5 font-bebas text-5xl leading-[0.95] tracking-wide text-text-base sm:text-6xl lg:text-7xl">
            ENTENDA O <span className="text-accent">PORQUÊ</span> DE CADA RESPOSTA
          </h1>
          <p className="mb-7 max-w-[480px] text-sm leading-[1.7] text-muted sm:mb-8 sm:text-base">
            Questões de provas anteriores para o seu concurso. O comentário aparece depois que você responde.
          </p>
          <div className="mb-7 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:flex-wrap sm:gap-3.5">
            <Link
              href="/cadastro"
              className="rounded-lg bg-accent px-8 py-3.5 text-center text-sm font-bold text-bg transition-all hover:-translate-y-px hover:bg-accent2"
            >
              Criar conta
            </Link>
            <Link
              href="#como-funciona"
              className="rounded-lg border border-border bg-transparent px-8 py-3.5 text-center text-sm font-semibold text-text-base transition-colors hover:border-muted"
            >
              Ver como funciona
            </Link>
          </div>
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted sm:text-xs sm:tracking-[0.16em]">
            Jurídicas · Policiais · Bancárias · Nível médio e superior
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-4 sm:p-6">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-accent/10 blur-3xl" />
          <div className="relative">
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-border pb-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">Ciclo de estudo</span>
              <span className="rounded-full border border-border px-2.5 py-1 text-[10px] text-muted">Concursos públicos</span>
            </div>
            <div className="rounded-xl bg-surface2 p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Questão selecionada</p>
              <p className="mt-2 max-w-sm font-bebas text-2xl leading-tight tracking-wide text-text-base sm:text-3xl">
                Você responde primeiro. O comentário vem depois.
              </p>
              <div className="mt-5 space-y-2" aria-hidden="true">
                <div className="h-2 w-full rounded bg-border" />
                <div className="h-2 w-5/6 rounded bg-border" />
                <div className="h-2 w-2/3 rounded bg-border" />
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wide sm:text-xs">
                <span className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-accent">Sua resposta</span>
                <span className="text-muted" aria-hidden="true">→</span>
                <span className="rounded-lg border border-border px-3 py-2 text-muted">Correção</span>
                <span className="text-muted" aria-hidden="true">→</span>
                <span className="rounded-lg border border-border px-3 py-2 text-muted">Comentário</span>
              </div>
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs leading-relaxed text-muted">
              <span aria-hidden="true">🔒</span>
              Gabarito e comentário só aparecem depois da sua resposta.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-4 h-px bg-border sm:mx-8 lg:mx-10" />

      {/* Como funciona */}
      <div id="como-funciona" className="mx-auto max-w-[1100px] px-4 py-14 sm:px-8 sm:py-20 lg:px-10">
        <div className="text-xs font-bold tracking-widest text-accent uppercase mb-2">Como funciona</div>
        <div className="font-bebas text-4xl tracking-wide text-text-base mb-10">UM CICLO DE ESTUDO COM FEEDBACK</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-6">
          {[
            { n: 1, title: 'Crie sua conta', desc: 'Defina seu concurso e organize seus dados de estudo' },
            { n: 2, title: 'Escolha o foco', desc: 'Combine bancas, matérias e tamanho do simulado' },
            { n: 3, title: 'Responda', desc: 'A correção e o comentário aparecem depois da sua resposta' },
            { n: 4, title: 'Veja o resultado', desc: 'Acompanhe seus acertos por matéria e sua pontuação' },
          ].map(({ n, title, desc }) => (
            <div key={n} className="bg-surface border border-border rounded-xl p-5">
              <div className="font-bebas text-4xl text-accent mb-3">{n}</div>
              <h4 className="font-semibold text-text-base mb-1.5">{title}</h4>
              <p className="text-sm text-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-4 h-px bg-border sm:mx-8 lg:mx-10" />

      {/* Features */}
      <div id="recursos" className="mx-auto max-w-[1100px] px-4 py-14 sm:px-8 sm:py-20 lg:px-10">
        <div className="text-xs font-bold tracking-widest text-accent uppercase mb-2">Recursos</div>
        <div className="font-bebas text-4xl tracking-wide text-text-base mb-2">UM COMENTÁRIO PARA CADA QUESTÃO</div>
        <p className="text-muted text-sm mb-10">Um ciclo de estudo construído em torno de questões de provas anteriores e comentários que explicam cada resposta.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {[
            { icon: '🎯', title: 'Filtros de estudo', desc: 'Combine as bancas e matérias disponíveis para montar um simulado alinhado ao seu foco.' },
            { icon: '✍️', title: 'Questões comentadas', desc: 'Veja o comentário da questão somente depois de responder.' },
            { icon: '📊', title: 'Desempenho por matéria', desc: 'Acompanhe seus acertos, pontuação e tempo médio a partir dos simulados finalizados.' },
            { icon: '⚖️', title: 'Pontuação transparente', desc: 'Os pontos são calculados no servidor e aparecem somente ao final do simulado.' },
            { icon: '🏆', title: 'Ranking opcional', desc: 'Quem ativa a participação pode aparecer pelo nickname em recortes regional e nacional.' },
            { icon: '🔒', title: 'Privacidade por padrão', desc: 'E-mail, telefone e nome civil não aparecem no ranking.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-surface border border-border rounded-xl p-5">
              <div className="text-3xl mb-3">{icon}</div>
              <h3 className="font-semibold text-text-base mb-2">{title}</h3>
              <p className="text-sm text-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-4 h-px bg-border sm:mx-8 lg:mx-10" />

      {/* Planos + Ranking */}
      <div className="mx-auto max-w-[1100px] px-4 py-14 sm:px-8 sm:py-20 lg:px-10">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-[60px]">
          <div id="planos">
            <div className="text-xs font-bold tracking-widest text-accent uppercase mb-2">Planos</div>
            <div className="font-bebas text-4xl tracking-wide text-text-base mb-2">ESCOLHA SEU RITMO</div>
            <p className="text-muted text-sm mb-8">O Premium é contratado por Pix manual, com confirmação e ativação feitas pela equipe.</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Gratuito */}
              <div className="bg-surface border border-border rounded-xl p-5">
                <div className="font-semibold text-text-base mb-1">Gratuito</div>
                <div className="font-bebas text-3xl text-accent mb-4">Grátis</div>
                <ul className="flex flex-col gap-2 mb-5">
                  {['Simulados de 10 a 40 questões', 'Pontuação e estatísticas', 'Filtros por banca e matéria'].map((i) => (
                    <li key={i} className="text-xs text-muted flex items-center gap-1.5">✓ {i}</li>
                  ))}
                  {['Ranking completo'].map((i) => (
                    <li key={i} className="text-xs text-border flex items-center gap-1.5 line-through">✗ {i} (Premium)</li>
                  ))}
                </ul>
                <Link
                  href="/cadastro"
                  className="w-full py-2.5 rounded-lg text-sm font-bold border border-border text-text-base bg-transparent cursor-pointer hover:border-muted transition-colors"
                >
                  Criar conta grátis
                </Link>
              </div>
              {/* Premium */}
              <div className="bg-surface border border-accent/40 rounded-xl p-5 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-bg text-[11px] font-bold px-3 py-0.5 rounded-full">Pix manual</div>
                <div className="font-semibold text-text-base mb-1">Premium</div>
                <div className="font-bebas text-3xl text-accent mb-4">Ativação manual</div>
                <ul className="flex flex-col gap-2 mb-5">
                  {['Simulados de até 100 questões', 'Rankings nacional, estadual e municipal'].map((i) => (
                    <li key={i} className="text-xs text-muted flex items-center gap-1.5">✓ {i}</li>
                  ))}
                </ul>
                <Link href="/checkout/premium" className="inline-flex w-full justify-center rounded-lg border border-accent/40 px-4 py-2.5 text-sm font-bold text-accent no-underline">
                  Consultar Premium
                </Link>
              </div>
            </div>
          </div>

          {/* Ranking preview */}
          <div id="ranking">
            <div className="text-xs font-bold tracking-widest text-accent uppercase mb-2">Ranking</div>
            <div className="font-bebas text-4xl tracking-wide text-text-base mb-2">RANKING COM PARTICIPAÇÃO OPCIONAL</div>
            <p className="text-sm text-muted mb-6">A lista real é formada por quem ativou a participação no perfil. O acesso completo requer Premium.</p>
            <div className="rounded-xl border border-border bg-surface p-6">
              <p className="text-sm font-medium text-text-base">Ainda não há uma prévia pública.</p>
              <p className="mt-2 text-sm leading-6 text-muted">Não exibimos nomes ou pontuações fictícias. O ranking será montado com dados reais dos participantes opt-in.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-4 h-px bg-border sm:mx-8 lg:mx-10" />

      {/* Footer */}
      <footer id="legal" className="mx-auto max-w-[1100px] px-4 py-12 sm:px-8 sm:py-16 lg:px-10">
        <div className="mb-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto] lg:gap-16">
          <div>
            <Logo size="md" className="block mb-3" />
            <p className="text-sm text-muted leading-relaxed max-w-xs mb-4">
              Questões comentadas de provas anteriores para concursos públicos.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <h5 className="text-xs font-bold uppercase tracking-widest text-muted mb-1">Plataforma</h5>
            <Link href="#recursos" className="text-sm text-muted no-underline hover:text-text-base transition-colors">Recursos</Link>
            <Link href="#planos" className="text-sm text-muted no-underline hover:text-text-base transition-colors">Planos</Link>
            <Link href="#ranking" className="text-sm text-muted no-underline hover:text-text-base transition-colors">Ranking</Link>
            <Link href="/cadastro" className="text-sm text-muted no-underline hover:text-text-base transition-colors">Criar conta</Link>
          </div>
          <div className="flex flex-col gap-2">
            <h5 className="text-xs font-bold uppercase tracking-widest text-muted mb-1">Legal e Suporte</h5>
            <Link href="/termos" className="text-sm text-muted no-underline hover:text-text-base transition-colors">Termos de uso</Link>
            <Link href="/privacidade" className="text-sm text-muted no-underline hover:text-text-base transition-colors">Política de privacidade</Link>
          </div>
        </div>
        <div className="flex flex-col items-start justify-between gap-5 border-t border-border pt-6 sm:pt-8 lg:flex-row lg:gap-8">
          <p className="max-w-2xl text-xs leading-relaxed text-muted">
            <strong className="text-text-base">Aviso:</strong> A disponibilidade de questões de provas públicas depende dos direitos aplicáveis. Consulte os{' '}
            <Link href="/termos" className="text-accent underline">termos</Link> e a{' '}
            <Link href="/privacidade" className="text-accent underline">política de privacidade</Link>.
          </p>
          <div className="flex-shrink-0 text-left text-xs text-muted lg:text-right">
            <p>© 2026 Estudee</p>
            <p>Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
