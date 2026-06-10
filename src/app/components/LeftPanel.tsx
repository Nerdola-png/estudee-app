import Link from "next/link";
import { Logo } from "@/app/components/Logo";

export function LeftPanel() {
  return (
    <div className="bg-surface border-r border-border hidden md:flex flex-col justify-between p-10 relative overflow-hidden">
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[radial-gradient(circle,rgba(245,197,66,0.07)_0%,transparent_70%)]" />
      <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(63,200,122,0.05)_0%,transparent_70%)]" />

      <Link href="/" className="relative z-10">
        <Logo size="lg" />
      </Link>

      <div className="relative z-10">
        <h2 className="font-bebas text-5xl leading-none tracking-wide mb-4">
          QUESTÕES REAIS,<br />
          RANKING <em className="text-accent not-italic">REAL</em>,<br />
          APROVAÇÃO REAL.
        </h2>
        <p className="text-muted text-sm leading-relaxed max-w-sm mb-9">
          Estude com questões de provas já aplicadas, acumule pontos e veja seu
          nome subir no ranking da sua cidade.
        </p>
        <ul className="flex flex-col gap-3">
          {[
            { icon: "🎯", text: "Filtros por banca, cargo, matéria e estado" },
            { icon: "🔥", text: "Sequência de estudos — não deixe o fogo apagar" },
            { icon: "🏆", text: "Ranking por cidade, estado e nacional" },
            { icon: "📊", text: "Histórico inteligente: sem repetir o que já acertou" },
          ].map(({ icon, text }) => (
            <li key={text} className="flex items-center gap-2.5 text-sm text-muted">
              <span className="w-7 h-7 bg-accent/10 rounded-md flex items-center justify-center text-sm flex-shrink-0">
                {icon}
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative z-10 text-xs text-border">
        Estudee © 2025 — Versão Web
      </div>
    </div>
  );
}
