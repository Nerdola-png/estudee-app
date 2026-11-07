import Link from 'next/link';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const alternativaSchema = z.object({
  key: z.string(),
  texto: z.string(),
});

const questaoSchema = z.object({
  id: z.string().uuid(),
  ordem: z.number(),
  enunciado: z.string(),
  alternativas: z.array(alternativaSchema),
  materia: z.string(),
  anulada: z.boolean(),
  resposta: z.string().nullable(),
  resultado: z.object({
    acertou: z.boolean(),
    anulada: z.boolean(),
    gabarito: z.string().nullable(),
    justificativa: z.string().nullable(),
    justificativa_alternativas: z.unknown().nullable(),
  }).nullable(),
});

const sessaoSchema = z.object({
  sessao_id: z.string().uuid(),
  status: z.enum(['em_andamento', 'finalizado', 'abandonado']),
  total_questoes: z.number(),
  acertos: z.number(),
  questoes: z.array(questaoSchema),
});

function SemResultado() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-8">
      <div className="max-w-md rounded-xl border border-border bg-surface p-6 text-center">
        <h1 className="mb-2 font-bebas text-4xl text-text-base">Resultado indisponível</h1>
        <p className="mb-5 text-sm text-muted">Não encontramos uma sessão válida para esta conta.</p>
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
    return <SemResultado />;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('carregar_sessao', { p_sessao_id: sessaoId });
  const parsed = error ? null : sessaoSchema.safeParse(data);
  if (!parsed || !parsed.success) return <SemResultado />;

  const sessao = parsed.data;
  const respondidas = sessao.questoes.filter((questao) => questao.resultado !== null);
  const totalAcertos = respondidas.filter((questao) => questao.resultado?.acertou).length;
  const percentualGeral = respondidas.length === 0
    ? 0
    : Math.round((totalAcertos / respondidas.length) * 100);
  const desempenhoPorMateria = new Map<string, { acertos: number; total: number }>();

  for (const questao of respondidas) {
    const desempenho = desempenhoPorMateria.get(questao.materia) ?? { acertos: 0, total: 0 };
    desempenho.total += 1;
    if (questao.resultado?.acertou) desempenho.acertos += 1;
    desempenhoPorMateria.set(questao.materia, desempenho);
  }

  const materias = Array.from(desempenhoPorMateria, ([nome, desempenho]) => ({
    nome,
    ...desempenho,
    percentual: Math.round((desempenho.acertos / desempenho.total) * 100),
  })).sort((a, b) => a.percentual - b.percentual);

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

        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Acertos</p>
            <p className="mt-3 text-3xl font-bold text-text-base">{totalAcertos}/{respondidas.length}</p>
            <p className="mt-1 text-sm text-muted">Questões respondidas</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Taxa de acerto</p>
            <p className="mt-3 text-3xl font-bold text-accent">{percentualGeral}%</p>
            <p className="mt-1 text-sm text-muted">Desempenho nesta sessão</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Questões</p>
            <p className="mt-3 text-3xl font-bold text-text-base">{sessao.total_questoes}</p>
            <p className="mt-1 text-sm text-muted">Selecionadas para esta sessão</p>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5 md:p-7">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-text-base">Desempenho por matéria</h2>
            <p className="text-sm text-muted">Da matéria com menor percentual para a maior.</p>
          </div>
          {materias.length === 0 ? (
            <p className="text-sm text-muted">Ainda não há respostas registradas nesta sessão.</p>
          ) : (
            <div className="space-y-4">
              {materias.map((materia) => (
                <div key={materia.nome} className="rounded-lg border border-border bg-bg/40 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="font-medium text-text-base">{materia.nome}</span>
                    <span className="text-sm text-muted">{materia.acertos}/{materia.total}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-bg">
                    <div className={`h-full rounded-full ${
                      materia.percentual >= 80 ? 'bg-green' : materia.percentual >= 60 ? 'bg-accent' : 'bg-red-500'
                    }`} style={{ width: `${materia.percentual}%` }} />
                  </div>
                  <div className="mt-2 text-right text-sm font-medium text-muted">{materia.percentual}%</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link href="/filtros" className="inline-flex items-center justify-center rounded-lg border border-border px-5 py-3 text-sm font-medium text-text-base transition-colors hover:border-muted">
            Fazer outro simulado
          </Link>
        </div>
      </div>
    </main>
  );
}
