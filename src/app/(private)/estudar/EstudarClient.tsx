'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import {
  useFinalizarSessao,
  useRegistrarTempoAtivo,
  useResponderQuestao,
  useSessaoQuiz,
} from '@/hooks/use-quiz';

function formatarTempo(segundos: number) {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segundosRestantes = segundos % 60;

  return horas > 0
    ? `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundosRestantes.toString().padStart(2, '0')}`
    : `${minutos.toString().padStart(2, '0')}:${segundosRestantes.toString().padStart(2, '0')}`;
}

export default function EstudarClient({ sessaoId }: { sessaoId: string }) {
  const router = useRouter();
  const { data: sessao, isPending, error } = useSessaoQuiz(sessaoId);
  const responder = useResponderQuestao(sessaoId);
  const registrarTempo = useRegistrarTempoAtivo(sessaoId);
  const registrarTempoAtivo = registrarTempo.mutateAsync;
  const finalizarSessao = useFinalizarSessao(sessaoId);
  const statusSessao = sessao?.status;
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(null);
  const [tempoAtivoSegundos, setTempoAtivoSegundos] = useState(0);
  const [erroTempo, setErroTempo] = useState<string | null>(null);
  const tempoAtivoRef = useRef(0);
  const persistirTempoRef = useRef<() => Promise<void>>(async () => undefined);

  useEffect(() => {
    if (!sessao) return;

    tempoAtivoRef.current = Math.max(tempoAtivoRef.current, sessao.tempo_ativo_segundos);
    setTempoAtivoSegundos(tempoAtivoRef.current);
  }, [sessao?.tempo_ativo_segundos, sessao]);

  useEffect(() => {
    if (statusSessao !== 'em_andamento') return;

    let acumuladoMs = tempoAtivoRef.current * 1000;
    let iniciouEm = document.visibilityState === 'visible' ? Date.now() : null;
    let ultimaPersistencia = Date.now();

    const segundosAtuais = () => Math.floor(
      (acumuladoMs + (iniciouEm === null ? 0 : Date.now() - iniciouEm)) / 1000,
    );

    const persistir = async () => {
      if (iniciouEm !== null) {
        acumuladoMs += Date.now() - iniciouEm;
        iniciouEm = Date.now();
      }

      const total = Math.floor(acumuladoMs / 1000);
      tempoAtivoRef.current = Math.max(tempoAtivoRef.current, total);
      setTempoAtivoSegundos(tempoAtivoRef.current);

      try {
        await registrarTempoAtivo(tempoAtivoRef.current);
        setErroTempo(null);
      } catch {
        setErroTempo('Não foi possível salvar o tempo de estudo. Ele continuará contando neste dispositivo.');
      }
    };

    persistirTempoRef.current = persistir;

    const atualizarVisibilidade = () => {
      if (document.visibilityState === 'hidden') {
        void persistir();
        iniciouEm = null;
      } else if (iniciouEm === null) {
        iniciouEm = Date.now();
      }
    };

    const pausarAoSair = () => {
      void persistir();
      iniciouEm = null;
    };

    const intervalId = window.setInterval(() => {
      const agora = Date.now();
      const total = segundosAtuais();
      tempoAtivoRef.current = Math.max(tempoAtivoRef.current, total);
      setTempoAtivoSegundos(tempoAtivoRef.current);
      if (agora - ultimaPersistencia >= 15000) {
        ultimaPersistencia = agora;
        void persistir();
      }
    }, 1000);

    document.addEventListener('visibilitychange', atualizarVisibilidade);
    window.addEventListener('pagehide', pausarAoSair);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', atualizarVisibilidade);
      window.removeEventListener('pagehide', pausarAoSair);
      persistirTempoRef.current = async () => undefined;
    };
  }, [sessaoId, statusSessao, registrarTempoAtivo]);

  if (isPending) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-8">
        <div className="rounded-xl border border-border bg-surface px-6 py-5 text-sm text-muted">
          Carregando simulado…
        </div>
      </main>
    );
  }

  if (error || !sessao) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-8">
        <div className="max-w-md rounded-xl border border-border bg-surface p-6 text-center">
          <h1 className="mb-2 font-bebas text-4xl text-text-base">Não foi possível abrir o simulado</h1>
          <p className="mb-5 text-sm text-muted">Não foi possível carregar esta sessão. Volte aos filtros e tente novamente.</p>
          <Link href="/filtros" className="inline-flex rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-bg">
            Criar outro simulado
          </Link>
        </div>
      </main>
    );
  }

  const questao = sessao.questoes[indiceAtual];

  if (!questao) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-8">
        <div className="max-w-md rounded-xl border border-border bg-surface p-6 text-center">
          <h1 className="mb-2 font-bebas text-4xl text-text-base">Sem questões disponíveis</h1>
          <p className="mb-5 text-sm text-muted">Não há questões para os filtros selecionados.</p>
          <Link href="/filtros" className="inline-flex rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-bg">
            Voltar aos filtros
          </Link>
        </div>
      </main>
    );
  }

  const respostaAtual = responder.data && responder.variables?.questaoId === questao.id
    ? responder.data
    : questao.resultado;
  const alternativaSelecionada = questao.resposta ?? respostaSelecionada; // Context for selected answer
  const totalQuestoes = sessao.questoes.length;
  const progresso = Math.round(((indiceAtual + (respostaAtual ? 1 : 0)) / totalQuestoes) * 100);
  const acertos = sessao.questoes.filter((item) => item.resultado?.acertou).length
    + (responder.data?.acertou && responder.variables?.questaoId === questao.id && !questao.resultado ? 1 : 0);

  const confirmarResposta = async () => {
    if (!alternativaSelecionada || respostaAtual || responder.isPending) return;

    try {
      await responder.mutateAsync({
        questaoId: questao.id,
        resposta: alternativaSelecionada,
        tempoAtivoSegundos: tempoAtivoRef.current,
      });
    } catch {
      return;
    }
  };

  const proximaQuestao = async () => {
    if (!respostaAtual) return;

    if (indiceAtual === totalQuestoes - 1) {
      try {
        await persistirTempoRef.current();
        await finalizarSessao.mutateAsync();
      } catch {
        return;
      }
      router.push(`/resultado?sessao=${encodeURIComponent(sessaoId)}`);
      return;
    }

    setIndiceAtual((valor) => valor + 1);
    setRespostaSelecionada(null);
    responder.reset();
  };

  return (
    <main className="min-h-screen bg-bg px-4 py-8 md:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Simulado · {questao.materia}</p>
            <h1 className="font-bebas text-4xl tracking-[0.08em] text-text-base md:text-5xl">
              Questão {indiceAtual + 1} de {totalQuestoes}
            </h1>
          </div>
          <Link href="/dashboard" className="w-fit rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted transition-colors hover:border-muted hover:text-text-base">
            Sair do simulado
          </Link>
        </header>

        <section className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-border bg-surface px-4 py-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Tempo de estudo</p>
            <p aria-live="off" className="mt-1 font-mono text-2xl font-semibold tabular-nums text-text-base">
              {formatarTempo(tempoAtivoSegundos)}
            </p>
          </div>
          <span className="text-xs text-muted">Contagem acumulada da sessão</span>
        </section>

        {erroTempo && (
          <p role="status" className="mb-4 rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm text-accent">
            {erroTempo}
          </p>
        )}

        <section className="mb-6 overflow-hidden rounded-xl border border-border bg-surface p-4 md:p-6">
          <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-muted">
            <span>Progresso</span>
            <span>{progresso}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-bg">
            <div className="h-full rounded-full bg-accent transition-all duration-300" style={{ width: `${progresso}%` }} />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5 md:p-7">
          {questao.anulada && (
            <p className="mb-5 rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm text-accent">
              Esta questão foi anulada originalmente pela banca. Responda para registrar seu acerto.
            </p>
          )}
          <div className="mb-6 rounded-lg border border-border bg-bg/40 p-4">
            <p className="text-lg font-medium leading-8 text-text-base md:text-xl">{questao.enunciado}</p>
          </div>

          <div className="space-y-3">
            {questao.alternativas.map((alternativa) => {
              const selected = alternativaSelecionada === alternativa.key;
              const correct = Boolean(
                respostaAtual && (respostaAtual.anulada ? selected : alternativa.key === respostaAtual.gabarito)
              );
              const wrong = Boolean(respostaAtual && selected && !correct);

              return (
                <button
                  key={alternativa.key}
                  type="button"
                  onClick={() => !respostaAtual && setRespostaSelecionada(alternativa.key)}
                  disabled={Boolean(respostaAtual) || responder.isPending}
                  className={`flex w-full items-start gap-3 rounded-lg border px-4 py-4 text-left transition-colors ${
                    correct
                      ? 'border-green bg-green/10 text-text-base'
                      : wrong
                        ? 'border-red-500/60 bg-red-500/10 text-text-base'
                        : selected
                          ? 'border-accent bg-accent/10 text-text-base'
                          : 'border-border bg-bg/40 text-muted hover:border-muted hover:text-text-base'
                  }`}
                >
                  <span className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold ${
                    correct
                      ? 'border-green bg-green text-bg'
                      : wrong
                        ? 'border-red-500 bg-red-500 text-bg'
                        : selected
                          ? 'border-accent bg-accent text-bg'
                          : 'border-border bg-bg text-text-base'
                  }`}>
                    {alternativa.key}
                  </span>
                  <span className="flex-1 leading-7">{alternativa.texto}</span>
                </button>
              );
            })}
          </div>

          {respostaAtual && (
            <div className="mt-6 rounded-lg border border-border bg-bg/50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                  respostaAtual.acertou ? 'bg-green/15 text-green' : 'bg-red-500/15 text-red-400'
                }`}>
                  {respostaAtual.anulada
                    ? 'Anulada pela banca · acerto computado'
                    : respostaAtual.acertou
                      ? 'Acertou'
                      : `Errou · correta ${respostaAtual.gabarito}`}
                </span>
                <span className="text-xs uppercase tracking-[0.18em] text-muted">Comentário</span>
              </div>
              <p className="text-sm leading-7 text-text-base">{respostaAtual.justificativa ?? 'Sem comentário disponível.'}</p>
            </div>
          )}

          {responder.error && (
            <p role="alert" className="mt-4 text-sm text-red-400">Não foi possível registrar a resposta. Tente novamente.</p>
          )}
          {finalizarSessao.error && (
            <p role="alert" className="mt-4 text-sm text-red-400">
              Não foi possível finalizar a sessão: {finalizarSessao.error.message}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted">
              {responder.isPending ? 'Registrando resposta…' : respostaAtual ? 'Resposta registrada.' : 'Selecione uma alternativa para continuar.'}
            </div>
            {!respostaAtual ? (
              <Button
                type="button"
                disabled={!alternativaSelecionada || responder.isPending}
                onClick={() => void confirmarResposta()}
                className="bg-accent text-bg hover:bg-accent2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Confirmar resposta
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => void proximaQuestao()}
                disabled={finalizarSessao.isPending}
                className="bg-accent text-bg hover:bg-accent2 disabled:opacity-60"
              >
                {indiceAtual === totalQuestoes - 1
                  ? finalizarSessao.isPending ? 'Finalizando…' : 'Ver resultado'
                  : 'Próxima questão'}
              </Button>
            )}
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Acertos</p>
            <p className="mt-2 text-2xl font-bold text-text-base">{acertos}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Percentual</p>
            <p className="mt-2 text-2xl font-bold text-accent">{Math.round((acertos / totalQuestoes) * 100)}%</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Status</p>
            <p className="mt-2 text-lg font-semibold text-text-base">{respostaAtual ? 'Resposta confirmada' : 'Aguardando resposta'}</p>
          </div>
        </section>
      </div>
    </main>
  );
}
