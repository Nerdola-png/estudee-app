'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { MultiAutocomplete } from '@/app/components/ui/MultiAutocomplete';
import { useIniciarSessao, useOpcoesSimulado } from '@/hooks/use-quiz';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';

const opcoesQuantidade = ['10', '20', '30', '40'];

export default function FiltrosPage() {
  const router = useRouter();
  const { data: opcoes, error: erroOpcoes, isPending: carregandoOpcoes, refetch } = useOpcoesSimulado();
  const iniciarSessao = useIniciarSessao();
  const [bancaIds, setBancaIds] = useState<string[]>([]);
  const [materiaIds, setMateriaIds] = useState<string[]>([]);
  const [quantidade, setQuantidade] = useState('20');

  const bancaSelecionada = bancaIds
    .map((id) => opcoes?.bancas.find((item) => String(item.id) === id)?.nome)
    .filter((nome): nome is string => Boolean(nome))
    .join(', ') || 'Todas';
  const materiaSelecionada = materiaIds
    .map((id) => opcoes?.materias.find((item) => String(item.id) === id)?.nome)
    .filter((nome): nome is string => Boolean(nome))
    .join(', ') || 'Todas';
  const resumo = `${bancaSelecionada} • ${materiaSelecionada} • ${quantidade} questões`;

  const handleSubmit = async () => {
    try {
      const sessao = await iniciarSessao.mutateAsync({
        totalQuestoes: Number(quantidade),
        bancaIds: bancaIds.map(Number),
        materiaIds: materiaIds.map(Number),
      });
      router.push(`/estudar?sessao=${encodeURIComponent(sessao.sessao_id)}`);
    } catch {
      return;
    }
  };

  return (
    <main className="min-h-screen bg-bg px-4 py-8 md:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
              Novo simulado
            </p>
            <h1 className="font-bebas text-4xl tracking-[0.08em] text-text-base md:text-5xl">
              Monte seu treino
            </h1>
          </div>

          <Link
            href="/dashboard"
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted transition-colors hover:border-muted hover:text-text-base"
          >
            Voltar ao painel
          </Link>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">
          <section className="rounded-2xl border border-border bg-surface p-5 md:p-7">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-text-base">Filtros do simulado</h2>
                <p className="text-sm text-muted">Escolha o foco do seu treino.</p>
              </div>
              <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
                Curadoria
              </span>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <MultiAutocomplete
                label="Banca"
                placeholder="Digite para buscar bancas..."
                emptyMessage="Nenhuma banca encontrada."
                options={opcoes?.bancas ?? []}
                selectedIds={bancaIds}
                onChange={setBancaIds}
                disabled={carregandoOpcoes || Boolean(erroOpcoes)}
              />

              <MultiAutocomplete
                label="Matéria"
                placeholder="Digite para buscar matérias..."
                emptyMessage="Nenhuma matéria encontrada."
                options={opcoes?.materias ?? []}
                selectedIds={materiaIds}
                onChange={setMateriaIds}
                disabled={carregandoOpcoes || Boolean(erroOpcoes)}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-base">Quantidade</label>
                <Select value={quantidade} onValueChange={(value) => setQuantidade(value ?? '20')}>
                  <SelectTrigger className="w-full justify-between rounded-xl border border-border bg-bg/60 px-3 text-left text-sm text-text-base">
                    <SelectValue placeholder="Quantidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {opcoesQuantidade.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item} questões
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted">
                <span className="font-medium text-text-base">Resumo:</span> {resumo}
              </div>

              <Button
                type="button"
                onClick={handleSubmit}
                disabled={carregandoOpcoes || Boolean(erroOpcoes) || !opcoes || iniciarSessao.isPending}
                className="w-full bg-accent px-5 text-bg hover:bg-accent2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {carregandoOpcoes ? 'Carregando filtros…' : iniciarSessao.isPending ? 'Preparando simulado…' : 'Iniciar simulado →'}
              </Button>
            </div>

            {(erroOpcoes || iniciarSessao.error) && (
              <div role="alert" className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                {erroOpcoes
                  ? 'Não foi possível carregar os filtros do banco.'
                  : iniciarSessao.error?.message ?? 'Não foi possível iniciar o simulado.'}
                {erroOpcoes && (
                  <button type="button" onClick={() => void refetch()} className="ml-2 underline">
                    Tentar novamente
                  </button>
                )}
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-border bg-surface p-5">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
                Benefício
              </p>
              <h3 className="mb-3 text-xl font-semibold text-text-base">Foco no que realmente importa</h3>
              <p className="text-sm leading-6 text-muted">
                O treinamento prioriza questões relevantes para seu alvo, evitando volume vazio e mantendo a curva de estudo mais eficiente.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5">
              <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
                Configuração atual
              </p>

              <div className="space-y-3 text-sm text-muted">
                <div className="flex items-center justify-between gap-3">
                  <span>Banca</span>
                  <span className="font-medium text-text-base">{bancaSelecionada}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Matéria</span>
                  <span className="font-medium text-text-base">{materiaSelecionada}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Quantidade</span>
                  <span className="font-medium text-text-base">{quantidade}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
