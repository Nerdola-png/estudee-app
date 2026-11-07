import Link from 'next/link';

export default function PrivacidadePage() {
  return (
    <main className="min-h-screen bg-bg px-4 py-10 md:px-8">
      <article className="mx-auto max-w-3xl rounded-2xl border border-border bg-surface p-6 md:p-10">
        <Link href="/" className="text-sm font-medium text-accent underline">Voltar ao início</Link>
        <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">Privacidade</p>
        <h1 className="mt-2 font-bebas text-5xl tracking-wide text-text-base">Seus dados na Estudee</h1>
        <p className="mt-3 text-sm text-muted">Versão preliminar · 7 de novembro de 2026</p>

        <aside role="note" className="mt-6 rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm leading-6 text-text-base">
          Esta versão descreve o funcionamento atual do MVP e ainda precisa da identificação do controlador, do canal de privacidade, dos prazos de retenção e da revisão jurídica antes do lançamento público.
        </aside>

        <div className="mt-8 space-y-7 text-sm leading-7 text-muted">
          <section>
            <h2 className="text-lg font-semibold text-text-base">1. Dados tratados</h2>
            <p>A conta pode incluir nome, e-mail, cidade, estado, telefone, concurso-alvo e foto de perfil. Para o ranking, o usuário pode cadastrar nickname, UF e município pelo código IBGE e escolher se deseja participar. A plataforma também registra respostas, resultados, pontuação e tempo ativo dos simulados.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-text-base">2. Finalidades</h2>
            <p>Os dados de conta são usados para autenticação e funcionamento do perfil. Respostas e sessões são usadas para mostrar resultados e estatísticas. A localização e o nickname são usados no ranking somente quando o usuário ativa a participação.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-text-base">3. Compartilhamento e fornecedores</h2>
            <p>O serviço utiliza Supabase para autenticação e armazenamento de dados e Vercel para hospedagem da aplicação. O pagamento Premium é combinado por Pix manual, fora do aplicativo; a equipe confere o pagamento e ativa o acesso no banco de dados. O aplicativo não coleta dados bancários nem envia dados a um processador de pagamentos.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-text-base">4. Ranking opcional</h2>
            <p>Quando habilitado pelo usuário, o ranking público apresenta nickname e pontuação, sem e-mail, telefone ou nome civil. A opção pode ser alterada no perfil.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-text-base">5. Segurança e retenção</h2>
            <p>O acesso às sessões e às respostas é limitado ao respectivo usuário. Os prazos de retenção, o procedimento para exclusão da conta e os detalhes de resposta a incidentes devem ser definidos e publicados antes do lançamento.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-text-base">6. Solicitações de privacidade</h2>
            <p>O nome e o canal de contato do controlador precisam ser informados nesta seção para que o usuário possa exercer seus direitos relacionados a dados pessoais.</p>
          </section>
        </div>
      </article>
    </main>
  );
}
