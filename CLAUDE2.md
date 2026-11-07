# CLAUDE.md — Estudee

## Produto

Aplicação mobile-first de questões comentadas para concursos, começando por Brigada Militar / PC-RS. O diferencial é a curadoria e o comentário original de quem passou, não o volume de questões.

Estágio: MVP de validação. Toda mudança deve reforçar o ciclo de estudo e ser pequena o suficiente para validar com candidatos reais.

## Stack

- Next.js App Router + TypeScript strict
- Supabase: Postgres, Auth e Storage
- TanStack Query para consultas e mutações em Client Components
- Shadcn/ui e Tailwind CSS
- Deploy na Vercel
- PWA fora de escopo até haver demanda

## Modelo de dados atual

As migrations em `supabase/migrations/` são a fonte da verdade do schema.

- `materias`, `bancas`, `cargos` e `carreiras`: tabelas de referência.
- `questoes`: alternativas em JSONB, `gabarito`, `justificativa`, `ativo`, `status_gabarito`, dificuldade e tempo de referência.
- `sessoes` e `sessao_questoes`: sessões e respostas append-only; estatísticas são derivadas das sessões finalizadas.
- `profiles`: dados de conta, nickname e opt-in de ranking. A coluna legada `plano` não é fonte da verdade.
- `planos_config` define os tamanhos disponíveis e visibilidade do ranking.
- `assinaturas` é a fonte da verdade do plano efetivo; Premium é ativado manualmente após confirmação do Pix.
- `questoes_pontuadas` impede que uma questão pontue mais de uma vez por usuário.
- `ranking_pontos` contém agregados atualizados na finalização de cada sessão.

## Regras de arquitetura e segurança

- Nunca enviar gabarito ou comentário ao client antes de o usuário responder. Correção e comentário vêm da RPC `responder_questao`.
- Pontuação, sequência, tempo de resposta e consolidação são calculados no Postgres. Os pontos só são apresentados após `finalizar_sessao` e `obter_resultado`.
- O tempo informado pelo client é apenas informativo; não participa da fórmula de pontuação.
- Sessões, respostas, pontos, assinaturas e tabelas de ranking não são lidos diretamente pelo client. Usar RPCs com `SECURITY DEFINER`, `search_path = ''`, validação de `auth.uid()`, grants explícitos e RLS.
- `profiles.plano` não pode ser editado nem usado para autorizar recursos; consultar `plano_atual_usuario()`.
- Participar do ranking exige opt-in explícito. Exibir somente nickname e pontuação.
- Service-role somente no servidor ou em scripts locais. Nunca usar no browser e nunca prefixar segredos com `NEXT_PUBLIC_`.
- Premium usa Pix manual, fora do app: a equipe confirma o pagamento e registra a assinatura em `assinaturas` por meio administrativo. O client nunca ativa Premium nem confirma pagamento.
- O registro Pix deve usar `npm run pix:ativar -- <user_id> <dias> <operador_id>`, com `SUPABASE_SERVICE_ROLE_KEY` apenas em `.env.local` ou no ambiente seguro do operador. A RPC aceita exclusivamente `service_role`.
- Não integrar Stripe, checkout automático ou webhooks nesta fase. Informar chave Pix, valor e prazo somente depois de validar as condições comerciais.
- Data fetching em Server Components quando apropriado; mutations via RPC/Server Actions. Hooks TanStack Query ficam em `src/hooks/`.

## Escopo validado para esta fase

- Autenticação e recuperação de senha.
- Quiz: filtros → simulado → resposta e comentário → resultado com pontos → próxima sessão.
- Estatísticas por matéria derivadas do histórico finalizado.
- Tamanhos gratuitos de 10, 20, 30 e 40 questões; Premium adiciona tamanhos até 100.
- Pontos acumulam para todos os planos; o primeiro acerto de cada questão por usuário é o único que pontua.
- Ranking nacional, estadual e municipal é Premium; a posição individual limitada é consultável por todos.
- Assinaturas são registradas manualmente após confirmação de Pix; cobrança automática não está habilitada.

## Guardrails

- Não adicionar streak, ranking de retenção, anúncios, comunidade no app ou outras carreiras sem nova validação de produto.
- Não integrar provedor de pagamento nem checkout automático. Pix é manual; informar chave, valor, duração, cancelamento e reembolso antes de cobrar.
- Não construir CMS: questões entram pela pipeline de conteúdo aprovada.
- Não copiar comentários de concorrentes. Comentários são originais da equipe.
- Quando em dúvida: qual é a menor mudança que melhora o ciclo de estudo e pode ser validada?

## Convenções

- TypeScript strict; tipos do Supabase em `src/types/database.ts`, regenerados após mudanças no schema.
- Não usar `any`.
- Pastas de API routes em kebab-case.
- Interface e domínio em PT-BR.
- Componentes pequenos e focados; evitar abstração prematura.
- Enunciados e comentários usam markdown leve.

## Comandos

- `npm run dev` — ambiente local
- `npm run lint` — lint
- `npm run build` — build de produção
- `npx supabase migration new <nome>` — nova migration
- `npx supabase migration up` — aplicar migrations locais sem reset
- `npx supabase gen types typescript > src/types/database.ts` — regenerar tipos
- `npx supabase db lint --schema public` — validar o schema
- `npx supabase db query --file supabase/tests/scoring_and_access.sql` — testes SQL de pontuação e grants
- `npm run seed -- <arquivo.csv>` — validar e importar questões usando a service role do ambiente local

O CSV de questões deve conter `codigo`, `foco`, `tipo`, `banca_slug`, `materia_slug`, `cargo_slug`, `carreira_slug`, `estado_prova`, `ano`, `enunciado`, `alternativas`, `gabarito`, `justificativa`, `justificativa_alternativas`, `ativo`, `peso_dificuldade`, `t_ref_segundos` e `status_gabarito`. `alternativas` é um JSON array com `letra`/`key` e `texto`; questões ativas precisam de status definitivo ou anulada e comentário original. Slugs opcionais podem ficar vazios. O script valida o CSV inteiro antes de importar em lotes idempotentes pelo `codigo`; ele não cria questões nem dados de referência.

Mudanças de schema exigem migration versionada, regeneração de tipos e testes das RPCs/RLS afetadas.
