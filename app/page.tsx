'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './estudee.css';
import CadastroPage from './cadastro/page';
import { pathToFileURL } from 'node:url';

export default function EstudeeLandingPage() {
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
    console.log(`Navegar para: ${path}`);
  };

  return (
    <>
      {/* Importação das fontes (pode ser movida para o layout.tsx se preferir) */}
      <link
        href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap"
        rel="stylesheet"
      />

      <h2
        className="sr-only"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
        }}
      >
        Estudee — plataforma de estudos gamificados para concursos públicos
      </h2>

      <nav>
        <div className="logo">
          ESTU<span>DEE</span>
        </div>
        <div className="nav-links">
          <Link href="#">Recursos</Link>
          <Link href="#">Planos</Link>
          <Link href="#">Ranking</Link>
          <Link href="#">Suporte</Link>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn-secondary"
            style={{ padding: '9px 18px', fontSize: '14px', borderRadius: '6px' }}
            onClick={() => handleNavigation('/login')}
          >
            Entrar
          </button>
          <button
            className="btn-nav"
            onClick={() => handleNavigation('/cadastro')}
          >
            Criar Conta
          </button>
        </div>
      </nav>

      <div className="hero">
        <div>
          <div className="hero-badge">🔥 Estudos Gamificados</div>
          <h1>
            ESTUDOS <span className="highlight">RANKEADOS</span> ATÉ A SUA APROVAÇÃO
          </h1>
          <p>
            Simulados com questões reais de concursos públicos, sistema de pontuação e ranking nacional.
            Prepare-se do jeito certo — questão por questão.
          </p>
          <div className="hero-btns">
            <button
              className="btn-primary"
              onClick={() => handleNavigation('/comecar-gratis')}
            >
              Começar Gratuitamente
            </button>
            <button
              className="btn-secondary"
              onClick={() => handleNavigation('/cadastro')}
            >
              Ver como funciona
            </button>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <div className="stat-num">50K+</div>
              <div className="stat-label">Questões</div>
            </div>
            <div className="stat">
              <div className="stat-num">8+</div>
              <div className="stat-label">Bancas</div>
            </div>
            <div className="stat">
              <div className="stat-num">3</div>
              <div className="stat-label">Carreiras</div>
            </div>
          </div>
        </div>
        <div className="mockup">
          <div className="mock-top">
            <div className="mock-dot" style={{ background: '#FF5F57' }}></div>
            <div className="mock-dot" style={{ background: '#FFBD2E' }}></div>
            <div className="mock-dot" style={{ background: '#28C840' }}></div>
            <span style={{ fontSize: '12px', color: 'var(--muted)', marginLeft: '6px' }}>
              Simulado Polícia Civil — RS
            </span>
          </div>
          <div className="mock-question">
            <p>
              Quanto à prisão em flagrante delito, é correto afirmar que qualquer pessoa <em>poderá</em>{' '}
              prender em flagrante quem estiver em situação de:
            </p>
            <div className="mock-opt correct">A) Flagrante próprio, impróprio ou presumido ✓</div>
            <div className="mock-opt neutral">B) Flagrante próprio apenas</div>
            <div className="mock-opt neutral">C) Somente flagrante impróprio</div>
            <div className="mock-opt neutral">D) Flagrante preparado</div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Questão 12 de 40</span>
            <span style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 600 }}>+10 pts</span>
          </div>
          <div
            style={{
              background: 'var(--surface2)',
              borderRadius: '6px',
              height: '5px',
              marginBottom: '14px',
            }}
          >
            <div
              style={{
                background: 'var(--accent)',
                width: '30%',
                height: '100%',
                borderRadius: '6px',
              }}
            ></div>
          </div>
          <div className="mock-streak">
            <span className="flame">🔥</span>
            <span className="streak-text">Sequência de estudos</span>
            <span className="streak-days">7 dias</span>
          </div>
        </div>
      </div>

      <div className="divider"></div>

      <div className="section">
        <div className="section-label">Como funciona</div>
        <div className="section-title">PASSO-A-PASSO PARA O SEU NOME NO PÓDIO</div>
        <div className="how-grid">
          <div className="how-step">
            <div className="how-num">1</div>
            <h4>Crie sua conta</h4>
            <p>Gratuito. Informe sua cidade, estado e concurso alvo</p>
          </div>
          <div className="how-step">
            <div className="how-num">2</div>
            <h4>Escolha os filtros</h4>
            <p>Carreira, banca, matéria, cargo, estado e quantidade de questões</p>
          </div>
          <div className="how-step">
            <div className="how-num">3</div>
            <h4>Faça o simulado</h4>
            <p>Responda as questões, veja o gabarito e acumule pontos</p>
          </div>
          <div className="how-step">
            <div className="how-num">4</div>
            <h4>Suba no ranking</h4>
            <p>Compita com sua cidade, estado e o Brasil inteiro</p>
          </div>
        </div>
      </div>

      <div className="divider"></div>

      <div className="section">
        <div className="section-label">Recursos</div>
        <div className="section-title">TUDO QUE UM CONCURSEIRO PRECISA</div>
        <p className="section-sub">
          Da questão filtrada ao ranking nacional, a plataforma foi pensada para quem estuda de verdade.
        </p>
        <div className="features-grid">
          <div className="feat-card">
            <div className="feat-icon">🎯</div>
            <h3>Filtros Avançados</h3>
            <p>
              Filtre por carreira, banca, matéria, cargo, estado e ano. O sistema evita repetir questões que
              você já acertou.
            </p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">🏆</div>
            <h3>Ranking por Cidade</h3>
            <p>
              Compete com quem é da sua cidade, do seu estado ou do Brasil inteiro. Veja onde você está no
              pódio.
            </p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">🔥</div>
            <h3>Sequência de Estudos</h3>
            <p>Mantenha sua ofensiva ativa. Cada dia de estudo conta — não deixe sua sequência quebrar.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">📊</div>
            <h3>Estatísticas Detalhadas</h3>
            <p>Veja seu desempenho por matéria, banca e período. Entenda onde precisa melhorar (recurso premium).</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">📋</div>
            <h3>Simulado de Concurso Real</h3>
            <p>
              Reproduza uma prova que já aconteceu na ordem e condições originais, com cronômetro (recurso
              premium).
            </p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">⚡</div>
            <h3>Pontuação Imediata</h3>
            <p>10 pontos por acerto, gabarito na hora ou ao final do simulado, você decide!.</p>
          </div>
        </div>
      </div>

      <div className="divider"></div>

      <div className="section">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'start' }}>
          <div>
            <div className="section-label">Planos</div>
            <div className="section-title">ESCOLHA SEU PLANO</div>
            <p className="section-sub" style={{ marginBottom: '32px' }}>
              A versão gratuita já é poderosa. O premium é para quem quer ir além.
            </p>
            <div className="plans-grid">
              <div className="plan-card">
                <div className="plan-name">Gratuito</div>
                <div className="plan-price">
                  R$0<span>/mês</span>
                </div>
                <ul className="plan-list">
                  <li>Simulados de até 40 questões</li>
                  <li>Pontuação e histórico</li>
                  <li>Filtros completos</li>
                  <li className="no">Acesso ao ranking</li>
                  <li className="no">Simulado cronometrado</li>
                  <li className="no">Estatísticas avançadas</li>
                </ul>
                <button
                  className="btn-plan outline"
                  onClick={() => handleNavigation('/cadastro')}
                >
                  Criar conta grátis
                </button>
              </div>
              <div className="plan-card featured">
                <div className="plan-badge">Premium</div>
                <div className="plan-name">Premium</div>
                <div className="plan-price">
                  R$49,90<span>/mês</span>
                </div>
                <ul className="plan-list">
                  <li>Simulados de até 100 questões</li>
                  <li>Acesso ao ranking nacional</li>
                  <li>Simulado de concurso real</li>
                  <li>Cronômetro no simulado</li>
                  <li>Estatísticas avançadas</li>
                  <li>Sem anúncios</li>
                </ul>
                <button
                  className="btn-plan primary"
                  onClick={() => handleNavigation('/checkout/premium')}
                >
                  Assinar agora
                </button>
              </div>
            </div>
          </div>
          <div>
            <div className="section-label">Ranking</div>
            <div className="section-title">SEU LUGAR NO PÓDIO</div>
            <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '24px' }}>
              Veja onde você está entre os concurseiros da sua cidade, estado e do país.
            </p>
            <div className="ranking-preview">
              <div className="rank-tab">
                <div className="rtab active">Cidade</div>
                <div className="rtab">Estado</div>
                <div className="rtab">Nacional</div>
              </div>
              <div className="rank-row">
                <div className="rank-pos gold">1</div>
                <div
                  className="rank-avatar"
                  style={{ background: 'rgba(245,197,66,.15)', color: 'var(--accent)' }}
                >
                  AO
                </div>
                <div className="rank-name">Ana O.</div>
                <div className="rank-pts">4.280 pts</div>
              </div>
              <div className="rank-row">
                <div className="rank-pos">2</div>
                <div className="rank-avatar">RS</div>
                <div className="rank-name">Rafael S.</div>
                <div className="rank-pts">3.950 pts</div>
              </div>
              <div className="rank-row">
                <div className="rank-pos">3</div>
                <div className="rank-avatar">CM</div>
                <div className="rank-name">Carla M.</div>
                <div className="rank-pts">3.710 pts</div>
              </div>
              <div className="rank-row" style={{ opacity: 0.5 }}>
                <div className="rank-pos">4</div>
                <div className="rank-avatar">VL</div>
                <div className="rank-name">Você</div>
                <div className="rank-pts" style={{ color: 'var(--muted)' }}>
                  — pts
                </div>
              </div>
              <div
                style={{
                  textAlign: 'center',
                  marginTop: '14px',
                  fontSize: '12px',
                  color: 'var(--muted)',
                }}
              >
                🔒 Ranking disponível no plano Premium
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="divider"></div>

      <footer>
        <div className="footer-top">
          <div className="footer-brand">
            <div className="logo" style={{ display: 'block', marginBottom: '12px' }}>
              ESTU<span>DEE</span>
            </div>
            <p>
              Plataforma de simulados com questões reais de concursos públicos. Estude com mais inteligência,
              avance no ranking e conquiste sua aprovação.
            </p>
            <div className="cnpj-badge">🏢 CNPJ: XX.XXX.XXX/0001-XX</div>
          </div>
          <div className="footer-col">
            <h5>Plataforma</h5>
            <Link href="#">Funcionalidades</Link>
            <Link href="#">Planos</Link>
            <Link href="#">Ranking</Link>
            <Link href="#">Criar conta</Link>
          </div>
          <div className="footer-col">
            <h5>Legal e Suporte</h5>
            <Link href="#">Termos de Uso</Link>
            <Link href="#">Política de Privacidade</Link>
            <Link href="#">Política de Assinatura</Link>
            <Link href="#">Suporte</Link>
            <Link href="#">suporte@estudee.com.br</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-bottom-row">
            <div className="footer-copy">
              <p style={{ marginBottom: '8px' }}>
                <strong style={{ color: 'var(--text)' }}>Aviso legal:</strong> As questões
                disponibilizadas nesta plataforma são de autoria das respectivas bancas organizadoras e foram
                extraídas de provas públicas já aplicadas. Cada questão é devidamente identificada com a banca,
                o concurso e o ano de origem. A assinatura Premium concede acesso a{' '}
                <em>recursos adicionais da plataforma</em> — organização, filtros, cronômetro e estatísticas —,
                não configura venda ou licenciamento das questões.
              </p>
              <p>
                Os dados pessoais coletados são tratados nos termos da Lei Geral de Proteção de Dados (Lei nº
                13.709/2018 — LGPD). Para dúvidas sobre privacidade, entre em contato pelo e-mail
                suporte@estudee.com.br.
              </p>
            </div>
            <div className="footer-right">
              <p>© 2025 Estudee Ltda.</p>
              <p>Todos os direitos reservados.</p>
              <p style={{ marginTop: '6px', fontSize: '10px', color: 'var(--border)' }}>
                v1.0 — Versão Web
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}