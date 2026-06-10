import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/app/components/StatCard";
import { LogoutButton } from "@/app/components/LogoutButton";
import { Logo } from "@/app/components/Logo";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login");

  const primeiroNome = profile.nome.split(" ")[0];
  const iniciais = `${profile.nome[0]}${profile.sobrenome[0]}`.toUpperCase();
  const isPremium = profile.plano === "premium";
  const hoje = new Date().toISOString().slice(0, 10);
  const streakAtiva = profile.streak_ultima_data === hoje;

  return (
    <div className="grid grid-cols-[240px_1fr] min-h-screen bg-bg font-sans">
      {/* ── Sidebar ── */}
      <aside className="bg-surface border-r border-border flex flex-col px-4 py-7 sticky top-0 h-screen overflow-y-auto">
        <Link href="/" className="block px-2 mb-9">
          <Logo size="md" />
        </Link>

        <nav className="flex flex-col gap-0.5 flex-1">
          {[
            { href: "/dashboard", icon: "⊞", label: "Início", active: true },
            { href: "/filtros", icon: "🎯", label: "Novo Simulado" },
            { href: "/estudar", icon: "📚", label: "Estudar" },
          ].map(({ href, icon, label, active }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium no-underline transition-all ${
                active
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:bg-surface2 hover:text-text-base"
              }`}
            >
              <span className="text-base w-5 text-center">{icon}</span>
              {label}
            </Link>
          ))}
          <Link
            href="/ranking"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-muted no-underline transition-all hover:bg-surface2 hover:text-text-base"
          >
            <span className="text-base w-5 text-center">🏆</span>
            Ranking
            {!isPremium && <span className="ml-auto text-[11px] opacity-60">🔒</span>}
          </Link>
        </nav>

        <div className="flex flex-col gap-3 pt-4 border-t border-border mt-4">
          {!isPremium && (
            <Link
              href="/checkout/premium"
              className="flex items-center gap-2.5 bg-accent/8 border border-accent/20 rounded-xl p-3 no-underline hover:bg-accent/14 transition-colors"
            >
              <span className="text-xl">⚡</span>
              <div>
                <div className="text-[13px] font-semibold text-accent">Ir para Premium</div>
                <div className="text-[11px] text-muted mt-px">Ranking + Estatísticas</div>
              </div>
            </Link>
          )}
          <Link
            href="/perfil"
            className="flex items-center gap-2.5 px-2 py-2.5 rounded-lg no-underline hover:bg-surface2 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-[13px] font-bold text-accent flex-shrink-0">
              {iniciais}
            </div>
            <div className="overflow-hidden">
              <div className="text-[13px] font-semibold text-text-base truncate">
                {profile.nome} {profile.sobrenome}
              </div>
              <div className="text-[11px] text-muted mt-px">
                {isPremium ? "⭐ Premium" : "Gratuito"}
              </div>
            </div>
          </Link>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="p-9 overflow-y-auto flex flex-col gap-8 max-w-[900px]">
        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="font-bebas text-3xl tracking-wide text-text-base">
              {saudacao()}, {primeiroNome} 👋
            </div>
            <div className="text-sm text-muted mt-0.5">
              {profile.concurso_alvo ? `Foco: ${profile.concurso_alvo}` : "Continue de onde parou"}
            </div>
          </div>
          <LogoutButton />
        </header>

        {/* Stats */}
        <section className="grid grid-cols-4 gap-4">
          <StatCard
            label="Pontuação total"
            value={profile.pontuacao.toLocaleString("pt-BR")}
            hint="+10 pts por acerto"
            accentValue
          />
          <StatCard
            label="Sequência"
            value={
              <span className="flex items-baseline gap-1.5">
                <span className="text-3xl">🔥</span>
                <span className={streakAtiva ? "text-accent" : ""}>
                  {profile.streak_dias} {profile.streak_dias === 1 ? "dia" : "dias"}
                </span>
              </span>
            }
            hint={streakAtiva ? "Você estudou hoje!" : "Estude hoje para não perder!"}
          />
          <StatCard
            label="Plano atual"
            value={<span className="text-xl mt-1">{isPremium ? "⭐ Premium" : "🆓 Gratuito"}</span>}
            hint={
              isPremium ? (
                "Acesso completo à plataforma"
              ) : (
                <Link href="/checkout/premium" className="text-accent no-underline">
                  Fazer upgrade →
                </Link>
              )
            }
          />
          <StatCard
            label="Localização"
            value={<span className="text-xl mt-1.5">{profile.cidade}</span>}
            hint={`${profile.estado} · Ranking local disponível`}
          />
        </section>

        {/* CTA */}
        <section>
          <div className="bg-surface border border-border rounded-2xl p-8 grid grid-cols-[1fr_auto] gap-10 items-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-accent/4" />
            <div>
              <div className="inline-flex items-center gap-1.5 bg-accent/10 border border-accent/25 text-accent px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase mb-3.5">
                🎯 Pronto para estudar?
              </div>
              <h2 className="font-bebas text-4xl tracking-wide text-text-base mb-2.5">
                COMECE UM SIMULADO AGORA
              </h2>
              <p className="text-sm text-muted leading-relaxed mb-5 max-w-[380px]">
                Escolha a banca, matéria e quantidade de questões. O sistema evita repetir o que você já acertou.
              </p>
              <div className="flex gap-3 flex-wrap">
                <Link href="/filtros" className="bg-accent text-bg px-6 py-3 rounded-lg font-bold text-sm no-underline hover:bg-accent2 transition-colors">
                  Montar simulado →
                </Link>
                <Link href="/estudar" className="bg-transparent text-text-base px-6 py-3 rounded-lg font-semibold text-sm border border-border no-underline hover:border-muted transition-colors">
                  Continuar estudo
                </Link>
              </div>
            </div>
            <div className="bg-surface2 border border-border rounded-xl px-5 py-4 min-w-[220px] flex flex-col gap-2.5">
              {[
                { dot: "bg-green", text: "Polícia Civil — Direito Penal" },
                { dot: "bg-accent", text: "CESPE · 20 questões · 30 min" },
                { dot: "bg-border", text: "Último: 14/20 acertos · +140 pts" },
              ].map(({ dot, text }) => (
                <div key={text} className="flex items-center gap-2 text-xs text-muted">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
                  {text}
                </div>
              ))}
              <div className="h-1 bg-border rounded-full mt-1">
                <div className="h-full bg-accent rounded-full w-[70%]" />
              </div>
            </div>
          </div>
        </section>

        {/* Histórico */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bebas text-2xl tracking-wide text-text-base">Simulados recentes</h3>
            <Link href="/estudar" className="text-sm text-accent no-underline font-medium">Ver todos →</Link>
          </div>
          <div className="bg-surface border border-border rounded-xl py-12 px-6 text-center">
            <div className="text-4xl mb-3">📋</div>
            <div className="text-base font-semibold text-text-base mb-1.5">Nenhum simulado ainda</div>
            <div className="text-sm text-muted mb-5">
              Seu histórico vai aparecer aqui depois do primeiro simulado.
            </div>
            <Link href="/filtros" className="bg-accent text-bg px-5 py-2.5 rounded-lg font-bold text-sm no-underline hover:bg-accent2 transition-colors inline-block">
              Fazer meu primeiro simulado →
            </Link>
          </div>
        </section>

        {/* Ranking bloqueado */}
        {!isPremium && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bebas text-2xl tracking-wide text-text-base">
                Ranking — {profile.cidade}
              </h3>
              <span className="text-[11px] font-bold text-muted bg-surface border border-border px-2.5 py-0.5 rounded-full">
                🔒 Premium
              </span>
            </div>
            <div className="relative bg-surface border border-border rounded-xl overflow-hidden">
              <div className="py-2 blur-sm pointer-events-none select-none">
                {["Ana O.", "Rafael S.", "Carla M."].map((nome, i) => (
                  <div key={nome} className="flex items-center gap-3 px-5 py-3 border-b border-border last:border-0">
                    <span className="font-bebas text-lg text-muted w-5">{i + 1}</span>
                    <div className="w-8 h-8 rounded-full bg-surface2 flex items-center justify-center text-xs font-semibold text-text-base">
                      {nome.split(" ").map((p) => p[0]).join("")}
                    </div>
                    <span className="flex-1 text-sm font-medium text-text-base">{nome}</span>
                    <span className="font-bebas text-base text-accent">
                      {(4280 - i * 330).toLocaleString("pt-BR")} pts
                    </span>
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-bg/60 backdrop-blur-sm">
                <div className="text-center text-text-base text-sm">
                  <div className="text-3xl mb-2.5">🏆</div>
                  <div className="font-semibold mb-1.5">Ranking disponível no Premium</div>
                  <Link href="/checkout/premium" className="bg-accent text-bg px-5 py-2.5 rounded-lg font-bold text-[13px] no-underline hover:bg-accent2 transition-colors inline-block">
                    Desbloquear →
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}
