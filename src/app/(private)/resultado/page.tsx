import Link from 'next/link';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const resultadoSchema = z.object({
  sessao_id: z.string().uuid(),
  status: z.literal('finalizado'),
  total_questoes: z.number().int(),
  questoes_respondidas: z.number().int(),
  acertos: z.number().int(),
  pontos_total: z.number(),
  media_pontos_por_questao: z.number().nullable(),
  tempo_ativo_segundos: z.number().int(),
  tempo_medio_questao_segundos: z.number(),
  materias: z.array(z.object({
    materia: z.string(),
    acertos: z.number().int(),
    total: z.number().int(),
    percentual: z.number(),
    tempo_medio_segundos: z.number(),
  })),
});

function formatarTempo(segundos: number) {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segundosRestantes = segundos % 60;

  return horas > 0
    ? `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundosRestantes.toString().padStart(2, '0')}`
    : `${minutos.toString().padStart(2, '0')}:${segundosRestantes.toString().padStart(2, '0')}`;
}

function SemResultado({ motivo }: { motivo: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-8">
      <div className="max-w-md rounded-xl border border-border bg-surface p-6 text-center">
        <h1 className="mb-2 font-bebas text-4xl text-text-base">Resultado indisponível</h1>
        <p role="alert" className="mb-5 text-sm text-muted">{motivo}</p>
        <Link href="/filtros" className="inline-flex rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-bg">
          Iniciar simulado
        </Link>
      </div>
    </main>
  );
}

export default async function ResultadoPage({
  searchParams,
}: {
  searchParams: Promise<{ sessao?: string }>;
}) {
  const { sessao: sessaoId } = await searchParams;
  if (!sessaoId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessaoId)) {
    return <SemResultado motivo="Não encontramos uma sessão válida para esta conta." />;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('obter_resultado', { p_sessao_id: sessaoId });

  if (error) {
    return <SemResultado motivo="Finalize todas as questões para consultar o resultado desta sessão." />;
  }

  const parsed = resultadoSchema.safeParse(data);
  if (!parsed.success) {
    return <SemResultado motivo="O formato do resultado não é válido. Tente novamente mais tarde." />;
  }

  const resultado = parsed.data;
  const percentualGeral = resultado.questoes_respondidas === 0
    ? 0
    : Math.round((resultado.acertos / resultado.questoes_respondidas) * 100);

  return (
    <main className="min-h-screen bg-bg px-4 py-8 md:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Resultado</p>
            <h1 className="font-bebas text-4xl tracking-[0.08em] text-text-base md:text-5xl">Seu desempenho</h1>
          </div>
          <Link href="/dashboard" className="w-fit rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted transition-colors hover:border-muted hover:text-text-base">
            Voltar ao painel
          </Link>
        </header>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Pontos</p>
            <p className="mt-3 text-3xl font-bold text-accent">{resultado.pontos_total.toLocaleString('pt-BR')}</p>
            <p className="mt-1 text-sm text-muted">Pontuação desta sessão</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Acertos</p>
            <p className="mt-3 text-3xl font-bold text-text-base">{resultado.acertos}/{resultado.questoes_respondidas}</p>
            <p className="mt-1 text-sm text-muted">{percentualGeral}% de acerto</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Média por questão</p>
            <p className="mt-3 text-3xl font-bold text-text-base">
              {resultado.media_pontos_por_questao?.toLocaleString('pt-BR') ?? '—'}
            </p>
            <p className="mt-1 text-sm text-muted">Pontos por questão selecionada</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Tempo ativo</p>
            <p className="mt-3 font-mono text-3xl font-bold tabular-nums text-text-base">
              {formatarTempo(resultado.tempo_ativo_segundos)}
            </p>
            <p className="mt-1 text-sm text-muted">Tempo acumulado de estudo</p>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5 md:p-7">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-text-base">Desempenho por matéria</h2>
            <p className="text-sm text-muted">Da matéria com menor percentual para a maior.</p>
          </div>
          {resultado.materias.length === 0 ? (
            <p className="text-sm text-muted">Ainda não há respostas registradas nesta sessão.</p>
          ) : (
            <div className="space-y-4">
              {resultado.materias.map((materia) => (
                <div key={materia.materia} className="rounded-lg border border-border bg-bg/40 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="font-medium text-text-base">{materia.materia}</span>
                    <span className="text-sm text-muted">{materia.acertos}/{materia.total} · {materia.percentual}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-bg">
                    <div className={`h-full rounded-full ${
                      materia.percentual >= 80 ? 'bg-green' : materia.percentual >= 60 ? 'bg-accent' : 'bg-red-500'
                    }`} style={{ width: `${materia.percentual}%` }} />
                  </div>
                  <p className="mt-2 text-right text-xs text-muted">
                    Tempo médio por questão: {materia.tempo_medio_segundos.toLocaleString('pt-BR')} s
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link href="/filtros" className="inline-flex items-center justify-center rounded-lg border border-border px-5 py-3 text-sm font-medium text-text-base transition-colors hover:border-muted">
            Fazer outro simulado
          </Link>
          <Link href="/ranking" className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-bg transition-colors hover:bg-accent2">
            Ver ranking
          </Link>
        </div>
      </div>
    </main>
  );
}
