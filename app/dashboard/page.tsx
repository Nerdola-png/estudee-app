import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'
import '../estudee.css'
import './dashboard.css'
import LogoutButton from './LogoutButton'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const primeiroNome = profile.nome.split(' ')[0]
  const iniciais = `${profile.nome[0]}${profile.sobrenome[0]}`.toUpperCase()
  const isPremium = profile.plano === 'premium'

  // Streak: verifica se estudou hoje
  const hoje = new Date().toISOString().slice(0, 10)
  const streakAtiva = profile.streak_ultima_data === hoje

  return (
    <div className="dash-wrapper">
      <link
        href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap"
        rel="stylesheet"
      />

      {/* ── Sidebar ── */}
      <aside className="dash-sidebar">
        <Link href="/" className="dash-logo">ESTU<span>DEE</span></Link>

        <nav className="dash-nav">
          <Link href="/dashboard" className="dash-nav-item active">
            <span className="dash-nav-icon">⊞</span>
            Início
          </Link>
          <Link href="/filtros" className="dash-nav-item">
            <span className="dash-nav-icon">🎯</span>
            Novo Simulado
          </Link>
          <Link href="/estudar" className="dash-nav-item">
            <span className="dash-nav-icon">📚</span>
            Estudar
          </Link>
          <Link href="/ranking" className="dash-nav-item">
            <span className="dash-nav-icon">🏆</span>
            Ranking
            {!isPremium && <span className="dash-nav-lock">🔒</span>}
          </Link>
        </nav>

        <div className="dash-sidebar-bottom">
          {/* Plano */}
          {!isPremium && (
            <Link href="/checkout/premium" className="dash-upgrade-card">
              <div className="dash-upgrade-icon">⚡</div>
              <div>
                <div className="dash-upgrade-title">Ir para Premium</div>
                <div className="dash-upgrade-sub">Ranking + Estatísticas</div>
              </div>
            </Link>
          )}

          {/* Perfil */}
          <Link href="/perfil" className="dash-user-row">
            <div className="dash-avatar">{iniciais}</div>
            <div className="dash-user-info">
              <div className="dash-user-name">{profile.nome} {profile.sobrenome}</div>
              <div className="dash-user-plan">{isPremium ? '⭐ Premium' : 'Gratuito'}</div>
            </div>
          </Link>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="dash-main">

        {/* Header */}
        <header className="dash-header">
          <div>
            <div className="dash-header-greeting">
              {saudacao()}, {primeiroNome} 👋
            </div>
            <div className="dash-header-sub">
              {profile.concurso_alvo
                ? `Foco: ${profile.concurso_alvo}`
                : 'Continue de onde parou'}
            </div>
          </div>
          <LogoutButton />
        </header>

        {/* ── Stats ── */}
        <section className="dash-stats">
          <div className="dash-stat-card">
            <div className="dash-stat-label">Pontuação total</div>
            <div className="dash-stat-value accent">
              {profile.pontuacao.toLocaleString('pt-BR')}
            </div>
            <div className="dash-stat-hint">+10 pts por acerto</div>
          </div>

          <div className="dash-stat-card">
            <div className="dash-stat-label">Sequência</div>
            <div className="dash-stat-value" style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '28px' }}>🔥</span>
              <span className={streakAtiva ? 'accent' : ''}>
                {profile.streak_dias} {profile.streak_dias === 1 ? 'dia' : 'dias'}
              </span>
            </div>
            <div className="dash-stat-hint">
              {streakAtiva ? 'Você estudou hoje!' : 'Estude hoje para não perder!'}
            </div>
          </div>

          <div className="dash-stat-card">
            <div className="dash-stat-label">Plano atual</div>
            <div className="dash-stat-value" style={{ fontSize: '22px', marginTop: '4px' }}>
              {isPremium ? '⭐ Premium' : '🆓 Gratuito'}
            </div>
            <div className="dash-stat-hint">
              {isPremium
                ? 'Acesso completo à plataforma'
                : <Link href="/checkout/premium" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Fazer upgrade →</Link>
              }
            </div>
          </div>

          <div className="dash-stat-card">
            <div className="dash-stat-label">Localização</div>
            <div className="dash-stat-value" style={{ fontSize: '20px', marginTop: '6px' }}>
              {profile.cidade}
            </div>
            <div className="dash-stat-hint">{profile.estado} · Ranking local disponível</div>
          </div>
        </section>

        {/* ── CTA Principal ── */}
        <section className="dash-cta-section">
          <div className="dash-cta-card">
            <div className="dash-cta-left">
              <div className="dash-cta-badge">🎯 Pronto para estudar?</div>
              <h2 className="dash-cta-title">COMECE UM SIMULADO AGORA</h2>
              <p className="dash-cta-desc">
                Escolha a banca, matéria e quantidade de questões. O sistema evita repetir o que você já acertou.
              </p>
              <div className="dash-cta-btns">
                <Link href="/filtros" className="dash-btn-primary">
                  Montar simulado →
                </Link>
                <Link href="/estudar" className="dash-btn-secondary">
                  Continuar estudo
                </Link>
              </div>
            </div>
            <div className="dash-cta-mockup">
              <div className="dash-mock-item">
                <span className="dash-mock-dot green" />
                <span>Polícia Civil — Direito Penal</span>
              </div>
              <div className="dash-mock-item">
                <span className="dash-mock-dot yellow" />
                <span>CESPE · 20 questões · 30 min</span>
              </div>
              <div className="dash-mock-item">
                <span className="dash-mock-dot muted" />
                <span>Último: 14/20 acertos · +140 pts</span>
              </div>
              <div className="dash-mock-progress">
                <div className="dash-mock-progress-bar" style={{ width: '70%' }} />
              </div>
            </div>
          </div>
        </section>

        {/* ── Histórico placeholder ── */}
        <section className="dash-section">
          <div className="dash-section-header">
            <h3 className="dash-section-title">Simulados recentes</h3>
            <Link href="/estudar" className="dash-section-link">Ver todos →</Link>
          </div>

          <div className="dash-empty-state">
            <div className="dash-empty-icon">📋</div>
            <div className="dash-empty-title">Nenhum simulado ainda</div>
            <div className="dash-empty-sub">
              Seu histórico vai aparecer aqui depois do primeiro simulado.
            </div>
            <Link href="/filtros" className="dash-btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>
              Fazer meu primeiro simulado →
            </Link>
          </div>
        </section>

        {/* ── Ranking preview (premium gate) ── */}
        {!isPremium && (
          <section className="dash-section">
            <div className="dash-section-header">
              <h3 className="dash-section-title">Ranking — {profile.cidade}</h3>
              <span className="dash-premium-badge">🔒 Premium</span>
            </div>
            <div className="dash-locked-card">
              <div className="dash-locked-blur">
                {['Ana O.', 'Rafael S.', 'Carla M.'].map((nome, i) => (
                  <div key={nome} className="dash-rank-row">
                    <span className="dash-rank-pos">{i + 1}</span>
                    <div className="dash-rank-avatar">{nome.split(' ').map(p => p[0]).join('')}</div>
                    <span className="dash-rank-name">{nome}</span>
                    <span className="dash-rank-pts">{(4280 - i * 330).toLocaleString('pt-BR')} pts</span>
                  </div>
                ))}
              </div>
              <div className="dash-locked-overlay">
                <div className="dash-locked-msg">
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>🏆</div>
                  <div style={{ fontWeight: 600, marginBottom: '6px' }}>Ranking disponível no Premium</div>
                  <Link href="/checkout/premium" className="dash-btn-primary" style={{ fontSize: '13px', padding: '10px 20px' }}>
                    Desbloquear →
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

      </main>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function saudacao() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

