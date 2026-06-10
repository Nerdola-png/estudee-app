'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/app/components/Logo';

export default function EstudeeLandingPage() {
  const router = useRouter();
  const nav = (path: string) => router.push(path);

  return (
    <>
      <nav className="flex items-center justify-between px-10 py-[18px] border-b border-border bg-bg/90 sticky top-0 z-50 backdrop-blur-[10px]">
        <Logo size="md" />
        <div className="flex gap-7 items-center">
          {['Recursos', 'Planos', 'Ranking', 'Suporte'].map((item) => (
            <Link key={item} href="#" className="text-muted no-underline text-sm font-medium hover:text-text-base transition-colors">
              {item}
            </Link>
          ))}
        </div>
        <div className="flex gap-2.5">
          <button
            className="bg-transparent text-text-base border border-border px-4 py-2 rounded-md text-sm font-semibold cursor-pointer hover:border-muted transition-colors"
            onClick={() => nav('/login')}
          >
            Entrar
          </button>
          <button
            className="bg-accent text-bg px-5 py-2 rounded-md text-sm font-semibold border-none cursor-pointer hover:bg-accent2 transition-colors"
            onClick={() => nav('/cadastro')}
          >
            Criar Conta
          </button>
        </div>
      </nav>

      <h2 className="sr-only">Estudee — plataforma de estudos gamificados para concursos públicos</h2>

      {/* Hero */}
      <div className="px-10 py-[90px] max-w-[1100px] mx-auto grid grid-cols-2 gap-[60px] items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-accent/12 border border-accent/30 text-accent px-3.5 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6 animate-pulse">
            🔥 Estudos Gamificados
          </div>
          <h1 className="font-bebas text-7xl leading-none tracking-wide text-text-base mb-5">
            ESTUDOS <span className="text-accent">RANKEADOS</span> ATÉ A SUA APROVAÇÃO
          </h1>
          <p className="text-muted text-base leading-[1.7] mb-8 max-w-[480px]">
            Simulados com questões reais de concursos públicos, sistema de pontuação e ranking nacional.
            Prepare-se do jeito certo — questão por questão.
          </p>
          <div className="flex gap-3.5 flex-wrap mb-10">
            <button
              className="bg-accent text-bg px-8 py-3.5 rounded-lg font-bold text-sm border-none cursor-pointer hover:bg-accent2 hover:-translate-y-px transition-all"
              onClick={() => nav('/comecar-gratis')}
            >
              Começar Gratuitamente
            </button>
            <button
              className="bg-transparent text-text-base px-8 py-3.5 rounded-lg font-semibold text-sm border border-border cursor-pointer hover:border-muted transition-colors"
              onClick={() => nav('/cadastro')}
            >
              Ver como funciona
            </button>
          </div>
          <div className="flex gap-8">
            {[
              { num: '50K+', label: 'Questões' },
              { num: '8+', label: 'Bancas' },
              { num: '3', label: 'Carreiras' },
            ].map(({ num, label }) => (
              <div key={label}>
                <div className="font-bebas text-4xl text-accent tracking-wide">{num}</div>
                <div className="text-xs text-muted uppercase tracking-wide">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Mockup */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          <div className="flex items-center gap-1.5 mb-4">
            <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
            <span className="w-3 h-3 rounded-full bg-[#28C840]" />
            <span className="text-xs text-muted ml-1.5">Simulado Polícia Civil — RS</span>
          </div>
          <div className="bg-surface2 rounded-xl p-4 mb-3">
            <p className="text-sm text-text-base leading-relaxed mb-3">
              Quanto à prisão em flagrante delito, é correto afirmar que qualquer pessoa <em>poderá</em> prender em flagrante quem estiver em situação de:
            </p>
            <div className="flex flex-col gap-1.5">
              <div className="text-xs px-3 py-2 rounded-lg bg-green/15 border border-green/30 text-green">A) Flagrante próprio, impróprio ou presumido ✓</div>
              {['B) Flagrante próprio apenas', 'C) Somente flagrante impróprio', 'D) Flagrante preparado'].map((opt) => (
                <div key={opt} className="text-xs px-3 py-2 rounded-lg bg-surface border border-border text-muted">{opt}</div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] text-muted">Questão 12 de 40</span>
            <span className="text-[11px] text-green font-semibold">+10 pts</span>
          </div>
          <div className="h-1.5 bg-surface2 rounded-full mb-3.5">
            <div className="h-full bg-accent rounded-full w-[30%]" />
          </div>
          <div className="flex items-center gap-2 bg-surface2 rounded-lg px-3 py-2.5">
            <span>🔥</span>
            <span className="text-xs text-muted flex-1">Sequência de estudos</span>
            <span className="text-xs font-bold text-accent">7 dias</span>
          </div>
        </div>
      </div>

      <div className="h-px bg-border mx-10" />

      {/* Como funciona */}
      <div className="px-10 py-20 max-w-[1100px] mx-auto">
        <div className="text-xs font-bold tracking-widest text-accent uppercase mb-2">Como funciona</div>
        <div className="font-bebas text-4xl tracking-wide text-text-base mb-10">PASSO-A-PASSO PARA O SEU NOME NO PÓDIO</div>
        <div className="grid grid-cols-4 gap-6">
          {[
            { n: 1, title: 'Crie sua conta', desc: 'Gratuito. Informe sua cidade, estado e concurso alvo' },
            { n: 2, title: 'Escolha os filtros', desc: 'Carreira, banca, matéria, cargo, estado e quantidade de questões' },
            { n: 3, title: 'Faça o simulado', desc: 'Responda as questões, veja o gabarito e acumule pontos' },
            { n: 4, title: 'Suba no ranking', desc: 'Compita com sua cidade, estado e o Brasil inteiro' },
          ].map(({ n, title, desc }) => (
            <div key={n} className="bg-surface border border-border rounded-xl p-5">
              <div className="font-bebas text-4xl text-accent mb-3">{n}</div>
              <h4 className="font-semibold text-text-base mb-1.5">{title}</h4>
              <p className="text-sm text-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="h-px bg-border mx-10" />

      {/* Features */}
      <div className="px-10 py-20 max-w-[1100px] mx-auto">
        <div className="text-xs font-bold tracking-widest text-accent uppercase mb-2">Recursos</div>
        <div className="font-bebas text-4xl tracking-wide text-text-base mb-2">TUDO QUE UM CONCURSEIRO PRECISA</div>
        <p className="text-muted text-sm mb-10">Da questão filtrada ao ranking nacional, a plataforma foi pensada para quem estuda de verdade.</p>
        <div className="grid grid-cols-3 gap-5">
          {[
            { icon: '🎯', title: 'Filtros Avançados', desc: 'Filtre por carreira, banca, matéria, cargo, estado e ano. O sistema evita repetir questões que você já acertou.' },
            { icon: '🏆', title: 'Ranking por Cidade', desc: 'Compete com quem é da sua cidade, do seu estado ou do Brasil inteiro. Veja onde você está no pódio.' },
            { icon: '🔥', title: 'Sequência de Estudos', desc: 'Mantenha sua ofensiva ativa. Cada dia de estudo conta — não deixe sua sequência quebrar.' },
            { icon: '📊', title: 'Estatísticas Detalhadas', desc: 'Veja seu desempenho por matéria, banca e período. Entenda onde precisa melhorar (recurso premium).' },
            { icon: '📋', title: 'Simulado de Concurso Real', desc: 'Reproduza uma prova que já aconteceu na ordem e condições originais, com cronômetro (recurso premium).' },
            { icon: '⚡', title: 'Pontuação Imediata', desc: '10 pontos por acerto, gabarito na hora ou ao final do simulado, você decide!' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-surface border border-border rounded-xl p-5">
              <div className="text-3xl mb-3">{icon}</div>
              <h3 className="font-semibold text-text-base mb-2">{title}</h3>
              <p className="text-sm text-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="h-px bg-border mx-10" />

      {/* Planos + Ranking */}
      <div className="px-10 py-20 max-w-[1100px] mx-auto">
        <div className="grid grid-cols-2 gap-[60px] items-start">
          <div>
            <div className="text-xs font-bold tracking-widest text-accent uppercase mb-2">Planos</div>
            <div className="font-bebas text-4xl tracking-wide text-text-base mb-2">ESCOLHA SEU PLANO</div>
            <p className="text-muted text-sm mb-8">A versão gratuita já é poderosa. O premium é para quem quer ir além.</p>
            <div className="grid grid-cols-2 gap-4">
              {/* Gratuito */}
              <div className="bg-surface border border-border rounded-xl p-5">
                <div className="font-semibold text-text-base mb-1">Gratuito</div>
                <div className="font-bebas text-3xl text-accent mb-4">R$0<span className="text-base text-muted font-sans">/mês</span></div>
                <ul className="flex flex-col gap-2 mb-5">
                  {['Simulados de até 40 questões', 'Pontuação e histórico', 'Filtros completos'].map((i) => (
                    <li key={i} className="text-xs text-muted flex items-center gap-1.5">✓ {i}</li>
                  ))}
                  {['Acesso ao ranking', 'Simulado cronometrado', 'Estatísticas avançadas'].map((i) => (
                    <li key={i} className="text-xs text-border flex items-center gap-1.5 line-through">✗ {i}</li>
                  ))}
                </ul>
                <button
                  className="w-full py-2.5 rounded-lg text-sm font-bold border border-border text-text-base bg-transparent cursor-pointer hover:border-muted transition-colors"
                  onClick={() => nav('/cadastro')}
                >
                  Criar conta grátis
                </button>
              </div>
              {/* Premium */}
              <div className="bg-surface border border-accent/40 rounded-xl p-5 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-bg text-[11px] font-bold px-3 py-0.5 rounded-full">Premium</div>
                <div className="font-semibold text-text-base mb-1">Premium</div>
                <div className="font-bebas text-3xl text-accent mb-4">R$49,90<span className="text-base text-muted font-sans">/mês</span></div>
                <ul className="flex flex-col gap-2 mb-5">
                  {['Simulados de até 100 questões', 'Acesso ao ranking nacional', 'Simulado de concurso real', 'Cronômetro no simulado', 'Estatísticas avançadas', 'Sem anúncios'].map((i) => (
                    <li key={i} className="text-xs text-muted flex items-center gap-1.5">✓ {i}</li>
                  ))}
                </ul>
                <button
                  className="w-full py-2.5 rounded-lg text-sm font-bold bg-accent text-bg border-none cursor-pointer hover:bg-accent2 transition-colors"
                  onClick={() => nav('/checkout/premium')}
                >
                  Assinar agora
                </button>
              </div>
            </div>
          </div>

          {/* Ranking preview */}
          <div>
            <div className="text-xs font-bold tracking-widest text-accent uppercase mb-2">Ranking</div>
            <div className="font-bebas text-4xl tracking-wide text-text-base mb-2">SEU LUGAR NO PÓDIO</div>
            <p className="text-sm text-muted mb-6">Veja onde você está entre os concurseiros da sua cidade, estado e do país.</p>
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <div className="flex gap-px bg-border">
                {['Cidade', 'Estado', 'Nacional'].map((tab, i) => (
                  <div
                    key={tab}
                    className={`flex-1 text-center py-2.5 text-xs font-semibold cursor-pointer ${i === 0 ? 'bg-surface text-accent' : 'bg-surface2 text-muted'}`}
                  >
                    {tab}
                  </div>
                ))}
              </div>
              {[
                { pos: 1, initials: 'AO', name: 'Ana O.', pts: 4280, gold: true },
                { pos: 2, initials: 'RS', name: 'Rafael S.', pts: 3950 },
                { pos: 3, initials: 'CM', name: 'Carla M.', pts: 3710 },
              ].map(({ pos, initials, name, pts, gold }) => (
                <div key={name} className="flex items-center gap-3 px-5 py-3 border-b border-border last:border-0">
                  <span className={`font-bebas text-lg w-5 ${gold ? 'text-accent' : 'text-muted'}`}>{pos}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${gold ? 'bg-accent/15 text-accent' : 'bg-surface2 text-text-base'}`}>{initials}</div>
                  <span className="flex-1 text-sm font-medium text-text-base">{name}</span>
                  <span className="font-bebas text-base text-accent">{pts.toLocaleString('pt-BR')} pts</span>
                </div>
              ))}
              <div className="flex items-center gap-3 px-5 py-3 opacity-50">
                <span className="font-bebas text-lg text-muted w-5">4</span>
                <div className="w-8 h-8 rounded-full bg-surface2 flex items-center justify-center text-xs font-semibold text-text-base">VL</div>
                <span className="flex-1 text-sm font-medium text-text-base">Você</span>
                <span className="font-bebas text-base text-muted">— pts</span>
              </div>
              <div className="text-center py-3 text-xs text-muted border-t border-border">
                🔒 Ranking disponível no plano Premium
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-border mx-10" />

      {/* Footer */}
      <footer className="px-10 py-16 max-w-[1100px] mx-auto">
        <div className="grid grid-cols-[1fr_auto_auto] gap-16 mb-10">
          <div>
            <Logo size="md" className="block mb-3" />
            <p className="text-sm text-muted leading-relaxed max-w-xs mb-4">
              Plataforma de simulados com questões reais de concursos públicos. Estude com mais inteligência, avance no ranking e conquiste sua aprovação.
            </p>
            <span className="text-xs text-muted border border-border rounded-full px-3 py-1">🏢 CNPJ: XX.XXX.XXX/0001-XX</span>
          </div>
          <div className="flex flex-col gap-2">
            <h5 className="text-xs font-bold uppercase tracking-widest text-muted mb-1">Plataforma</h5>
            {['Funcionalidades', 'Planos', 'Ranking', 'Criar conta'].map((l) => (
              <Link key={l} href="#" className="text-sm text-muted no-underline hover:text-text-base transition-colors">{l}</Link>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <h5 className="text-xs font-bold uppercase tracking-widest text-muted mb-1">Legal e Suporte</h5>
            {['Termos de Uso', 'Política de Privacidade', 'Política de Assinatura', 'Suporte', 'suporte@estudee.com.br'].map((l) => (
              <Link key={l} href="#" className="text-sm text-muted no-underline hover:text-text-base transition-colors">{l}</Link>
            ))}
          </div>
        </div>
        <div className="border-t border-border pt-8 flex items-start justify-between gap-8">
          <p className="text-xs text-muted leading-relaxed max-w-2xl">
            <strong className="text-text-base">Aviso legal:</strong> As questões disponibilizadas nesta plataforma são de autoria das respectivas bancas organizadoras e foram extraídas de provas públicas já aplicadas. A assinatura Premium concede acesso a <em>recursos adicionais da plataforma</em>. Os dados pessoais coletados são tratados nos termos da LGPD.
          </p>
          <div className="text-right flex-shrink-0 text-xs text-muted">
            <p>© 2025 Estudee Ltda.</p>
            <p>Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
