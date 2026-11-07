import Link from 'next/link';

export default function TermosPage() {
  return (
    <main className="min-h-screen bg-bg px-4 py-10 md:px-8">
      <article className="mx-auto max-w-3xl rounded-2xl border border-border bg-surface p-6 md:p-10">
        <Link href="/" className="text-sm font-medium text-accent underline">Voltar ao início</Link>
        <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">Termos de uso</p>
        <h1 className="mt-2 font-bebas text-5xl tracking-wide text-text-base">Uso da plataforma</h1>
        <p className="mt-3 text-sm text-muted">Versão preliminar · 7 de novembro de 2026</p>

        <aside role="note" className="mt-6 rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm leading-6 text-text-base">
          Este documento é um rascunho funcional. A identificação legal da empresa, os canais de atendimento, os preços e as condições comerciais precisam ser preenchidos e revisados antes de oferecer planos pagos ao público.
        </aside>

        <div className="mt-8 space-y-7 text-sm leading-7 text-muted">
          <section>
            <h2 className="text-lg font-semibold text-text-base">1. O serviço</h2>
            <p>A Estudee oferece simulados e comentários originais para apoiar a preparação para concursos. A disponibilidade de questões e recursos pode variar durante a fase de validação do produto.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-text-base">2. Conta e uso responsável</h2>
            <p>O usuário deve manter seus dados de acesso em segurança e usar a conta pessoalmente. Não é permitido tentar acessar dados, sessões ou recursos de outros usuários, nem interferir no funcionamento da plataforma.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-text-base">3. Pontuação e ranking</h2>
            <p>A pontuação é calculada pelo servidor conforme as regras vigentes do produto. Apenas o primeiro acerto de cada questão por usuário pode contribuir para o ranking. A participação no ranking é opcional e exibe o nickname escolhido pelo usuário.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-text-base">4. Planos e pagamentos</h2>
            <p>O Premium é contratado por Pix manual, combinado fora do aplicativo e confirmado pela equipe. O acesso é ativado manualmente no banco de dados após a confirmação do pagamento; nenhuma tela do client concede o plano. Valores, prazo de acesso, cancelamento e reembolso devem ser informados e aceitos antes do pagamento.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-text-base">5. Conteúdo</h2>
            <p>Os comentários são produzidos pela equipe da Estudee. O usuário não deve copiar ou redistribuir conteúdo protegido sem autorização. Questões de concursos são utilizadas conforme a disponibilidade e os direitos aplicáveis às respectivas provas.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-text-base">6. Atendimento</h2>
            <p>Antes da publicação definitiva, esta seção deve informar a razão social ou responsável legal e um canal de contato para dúvidas e solicitações relacionadas ao serviço.</p>
          </section>
        </div>
      </article>
    </main>
  );
}
