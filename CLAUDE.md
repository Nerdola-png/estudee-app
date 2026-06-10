CLAUDE.md — App de Questões para Concursos

Fonte da verdade complementar: @supabase/migrations.

O que é
App web mobile-first de questões comentadas para concursos públicos, começando pelo nicho Brigada Militar / PC-RS. Feito por aprovados.
Diferencial central: o comentário curado de quem passou é o produto — não o volume de questões. Concorrentes (QConcursos, Gran, TEC) ganham em volume; aqui se ganha em curadoria + foco no nicho. Toda decisão de produto deve reforçar isso.
Estágio: v0 (MVP de validação)
Objetivo: colocar o loop mínimo na mão de ~20 candidatos reais, cobrando preço de fundador. É teste, não lançamento. Disciplina de escopo é regra — ver Guardrails.
Stack

Next.js (App Router) + TypeScript (strict mode)
Tanstack Query
Shadcn/ui
Supabase: Postgres + Auth (magic link / Google)
Tailwind CSS
Deploy: Vercel
PWA: só na v0.5, se houver demanda

Modelo de dados
Detalhe completo em @SPEC_v0_concursos.md. Três tabelas:

materias — referência (id slug + nome). Toda matéria vem daqui; nunca string solta (a estatística por matéria depende disso).
questoes — alternativas em JSONB ([{letra, texto}]) + correta, comentario, banca, ano, orgao, materia_id, ativa.
respostas — log append-only (user_id, questao_id, alternativa, acertou, respondido_em).

Regra: toda estatística é derivada do log respostas. Nunca guardar totais agregados em coluna.
Regras de arquitetura (não-negociáveis)

Validação de resposta no servidor. Correção e comentario saem via RPC do Postgres (responder()) só depois que o usuário responde. Nunca enviar gabarito/comentário ao client antes da resposta — é conteúdo pago.
RLS ligado em respostas e perfis: cada usuário acessa só os próprios registros (auth.uid() = user_id).
Service key só em scripts locais / env (seed). Nunca no client — no client, apenas a anon key.
Data fetching em Server Components; mutações via Server Actions ou RPC.
Feature-âncora: % de acerto por matéria, ordenado da mais fraca para a mais forte.

Convenções de código

Pastas de API route em kebab-case.
TypeScript strict; usar os tipos gerados do Supabase (supabase gen types), nunca any.
Strings de UI e termos de domínio em PT-BR.
Componentes pequenos e focados. Evitar abstração prematura — priorizar entregar a fatia, não generalizar.
enunciado e comentario renderizados como markdown leve.

Guardrails de escopo (v0) — NÃO construir até validar
Estes overridam qualquer pedido de feature "que seria legal":

❌ Streak, ranking, gamificação (alavanca de retenção pós-validação, não de v0)
❌ Múltiplas carreiras / outros concursos (foco em UM)
❌ Anúncios
❌ Integração de pagamento — v0 = Pix manual + setar perfis.liberado_ate no banco
❌ Comunidade dentro do app (usar WhatsApp/Telegram que já existe)
✅ Apenas: auth → loop de quiz (responde → feedback + comentário → próxima → placar) → % de acerto por matéria

Quando em dúvida: "qual é a menor coisa que entrega o loop?"
Pipeline de conteúdo
Questões entram via planilha (Google Sheets) → CSV → script de seed (usa service key, monta o JSONB das alternativas). Não construir CMS na v0.

Questões: provas anteriores públicas (bancas liberam).
Comentário: sempre original do time. Nunca copiar gabarito comentado de concorrente (é propriedade deles).

Glossário de domínio

Banca: organizadora da prova (FGV, Cebraspe, FUNDATEC...).
Matéria: disciplina (Direito Penal, Português...).
Órgão: instituição do concurso (Brigada Militar, PC-RS).
Gabarito: alternativa correta.
Comentário: explicação da questão — o diferencial do produto.
Simulado: sessão de N questões.

Comandos

npm run dev — ambiente local
npm run build — build de produção
supabase migration new <nome> — nova migration
supabase db push — aplicar migrations
supabase gen types typescript --linked > src/types/db.ts — regenerar tipos após qualquer mudança de schema
npm run seed — popular questões a partir do CSV

Fluxo de trabalho esperado

Tarefas em fatias pequenas (uma vertical por vez), não o app inteiro de uma vez.
Mudança grande → propor plano antes de editar.
Mudou schema → rodar gen types antes de escrever código que usa as tabelas.
Escrever testes para o RPC de validação e para o cálculo de estatística.