import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { estatisticasSchema } from '@/schema/estatisticas';

function formatarTempo(segundos: number) {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  return horas > 0 ? `${horas} h ${minutos} min` : `${minutos} min`;
}

export default async function EstatisticasPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('obter_estatisticas');
  const parsed = error ? null : estatisticasSchema.safeParse(data);

  if (error || !parsed?.success) {
    return (
      <main className="min-h-screen bg-bg px-4 py-8 md:px-8 lg:px-10">
        <div className="mx-auto max-w-5xl rounded-2xl border border-red-500/30 bg-surface p-6">
          <h1 className="font-bebas text-4xl text-text-base">Não foi possível carregar as estatísticas</h1>
          <p role="alert" className="mt-2 text-sm text-muted">
            Tente novamente mais tarde. Seus resultados continuam salvos.
          </p>
        </div>
      </main>
    );
  }

  const estatisticas = parsed.data;
  const { resumo } = estatisticas;
  const foco = estatisticas.materias[0];
  const hasData = resumo.sessoes > 0;

  return (
    <main className="min-h-screen bg-bg px-4 py-8 md:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Estatísticas</p>
            <h1 className="font-bebas text-4xl tracking-[0.08em] text-text-base md:text-5xl">Seu desempenho</h1>
          </div>
          <Link href="/dashboard" className="w-fit rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted transition-colors hover:border-muted hover:text-text-base">
            Voltar ao painel
          </Link>
        </header>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Questões respondidas', value: resumo.questoes.toLocaleString('pt-BR'), detail: `${resumo.sessoes} simulados finalizados` },
            { label: 'Acertos', value: resumo.acertos.toLocaleString('pt-BR'), detail: `${resumo.percentual}% no histórico` },
            { label: 'Pontuação', value: resumo.pontos_total.toLocaleString('pt-BR'), detail: 'Pontos acumulados' },
            { label: 'Tempo de estudo', value: formatarTempo(resumo.tempo_ativo_segundos), detail: 'Tempo ativo registrado' },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-border bg-surface p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">{item.label}</p>
              <p className="mt-3 text-3xl font-bold text-text-base">{item.value}</p>
              <p className="mt-1 text-sm text-muted">{item.detail}</p>
            </div>
          ))}
        </section>

        {!hasData ? (
          <section className="rounded-2xl border border-border bg-surface p-8 text-center">
            <h2 className="text-xl font-semibold text-text-base">Seu histórico começa no primeiro simulado</h2>
            <p className="mt-2 text-sm text-muted">Finalize um simulado para acompanhar seu desempenho por matéria.</p>
            <Link href="/filtros" className="mt-5 inline-flex rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-bg">
              Montar simulado
            </Link>
          </section>
        ) : (
          <section className="rounded-2xl border border-border bg-surface p-5 md:p-7">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-text-base">Desempenho por matéria</h2>
              <p className="text-sm text-muted">Da matéria com menor percentual para a maior.</p>
            </div>
            <div className="space-y-4">
              {estatisticas.materias.map((item) => (
                <div key={item.materia} className="rounded-xl border border-border bg-bg/40 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="font-medium text-text-base">{item.materia}</span>
                    <span className="text-sm text-muted">{item.acertos}/{item.questoes} · {item.percentual}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-bg">
                    <div className={`h-full rounded-full ${
                      item.percentual >= 80 ? 'bg-green' : item.percentual >= 60 ? 'bg-accent' : 'bg-red-500'
                    }`} style={{ width: `${item.percentual}%` }} />
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-muted">
                    <span>{item.pontos.toLocaleString('pt-BR')} pontos</span>
                    <span>Média: {item.tempo_medio_segundos.toLocaleString('pt-BR')} s/questão</span>
                  </div>
                </div>
              ))}
            </div>
            {foco && (
              <p className="mt-5 text-sm text-muted">
                Priorize <strong className="text-text-base">{foco.materia}</strong>, sua matéria com menor taxa de acerto.
              </p>
            )}
          </section>
        )}

        <section className="mt-8 rounded-2xl border border-border bg-surface p-5 md:p-7">
          <h2 className="mb-4 text-xl font-semibold text-text-base">Simulados finalizados recentemente</h2>
          {estatisticas.sessoes_recentes.length === 0 ? (
            <p className="text-sm text-muted">Nenhum simulado finalizado ainda.</p>
          ) : (
            <ul className="divide-y divide-border">
              {estatisticas.sessoes_recentes.map((sessao) => (
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
      </div>
    </main>
  );
}
