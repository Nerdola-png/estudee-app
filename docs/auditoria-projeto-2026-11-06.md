# Auditoria do projeto — 2026-11-06

## Escopo e conclusão

Revisão do fluxo de autenticação, filtros, estudo e resultado; schema e policies do Supabase remoto; rotas restantes; dependências; configuração local; build e lint. O projeto compila e o fluxo de estudo foi conectado ao schema atual, mas ainda não está pronto para produção: existem vulnerabilidades de dependências, telas demonstrativas, recuperação de senha incompleta e pontos de Storage/configuração que precisam de confirmação ou implementação.

## Trabalho concluído nesta rodada

- Filtros agora leem `bancas` e `materias` reais, enviam IDs e iniciam uma sessão no banco.
- Estudo carrega `sessoes`/`sessao_questoes` por RPC. A correção é validada no Postgres e só é devolvida depois da resposta.
- Resultado é calculado a partir da sessão autenticada e agrupado por matéria.
- RPCs publicadas: `iniciar_sessao`, `carregar_sessao` e `responder_questao`, em [`supabase/migrations/20261106140000_add_secure_quiz_session_rpcs.sql`](../supabase/migrations/20261106140000_add_secure_quiz_session_rpcs.sql).
- Leitura anônima foi limitada a campos públicos de questões ativas; `gabarito` e justificativas permanecem sem grant, em [`supabase/migrations/20261106130000_enable_question_read_access.sql`](../supabase/migrations/20261106130000_enable_question_read_access.sql).
- Tipos de banco foram regenerados do schema local e hooks seguem TanStack Query.

## Achados prioritários

### P0 — Dependências com vulnerabilidades críticas

`npm audit` reportou 31 vulnerabilidades no total: 2 críticas, 13 altas, 15 moderadas e 1 baixa. Só em dependências de produção são 24: 2 críticas, 13 altas, 8 moderadas e 1 baixa. O audit aponta `next@16.2.7` como vulnerável e oferece `next@16.4.5` como correção; `proxy-addr` também aparece como crítica transitiva. `zod` e `shadcn` aparecem como dependências diretas vulneráveis. Atualizar com revisão de breaking changes e repetir build/audit; não usar `npm audit fix --force` sem avaliar a árvore.

### P1 — Storage/avatar sem policy confirmada e erros ignorados

O dump do schema remoto mostra RLS habilitado em `storage.objects`/`storage.buckets` e grants de operações para `anon`/`authenticated`, mas não exportou policies `CREATE POLICY`. O cadastro tenta enviar avatar ao bucket `avatars`, porém ignora falhas de upload e de atualização do perfil. Confirmar existência/visibilidade do bucket e aplicar policies restritas ao usuário e ao caminho `avatars/<auth.uid()>`; validar tipo MIME e tamanho no bucket, além do client.

Referência: [`src/app/(public)/cadastro/page.tsx`](../src/app/(public)/cadastro/page.tsx).

### P1 — Redefinição de senha não altera a senha

O login envia e-mail de recuperação, mas `/auth/reset-password` é um formulário estático: não lê a sessão/token de recovery, não valida os campos e não chama `supabase.auth.updateUser`. A tela pode afirmar sucesso sem atualizar credenciais.

Referências: [`src/app/(public)/login/page.tsx`](../src/app/(public)/login/page.tsx) e [`src/app/(private)/auth/reset-password/page.tsx`](../src/app/(private)/auth/reset-password/page.tsx).

### P1 — Exposição futura de tabelas por configuração padrão

`supabase/config.toml` deixa `auto_expose_new_tables` comentado e não documenta grants/RLS como requisito de criação. Com defaults do Supabase, tabelas novas em `public` podem ficar expostas à Data API. Definir exposição automática como desativada e exigir grants explícitos e RLS para cada tabela.

Referência: [`supabase/config.toml`](../supabase/config.toml).

### P1 — Cadastro pode confirmar sucesso com atualizações falhas

Após `signUp`, erros de upload e de `profiles.update` são ignorados. Se o projeto exigir confirmação de e-mail e não houver sessão ativa, telefone/concurso/avatar podem não ser gravados. O gatilho de perfil observado preenche apenas dados básicos da metadata. Tratar os erros e persistir dados opcionais por um caminho autorizado e consistente.

### P2 — Várias rotas ainda mostram dados fictícios ou ações vazias

- Estatísticas têm totais e matérias hardcoded; precisam derivar do histórico de sessões/respostas. [`src/app/(private)/estatisticas/page.tsx`](../src/app/(private)/estatisticas/page.tsx)
- Perfil mostra nome, e-mail, cidade, plano e metas de exemplo; “Editar perfil” não faz ação. [`src/app/(private)/perfil/page.tsx`](../src/app/(private)/perfil/page.tsx)
- Ranking usa usuários/pontos fictícios e não consulta dados reais. Além de incompleto, ranking/gamificação está fora do escopo v0 definido em [`CLAUDE.md`](../CLAUDE.md).
- Checkout simula pagamento. O próprio guardrail v0 determina Pix manual, sem integração. Deve ficar claramente marcado como indisponível ou fora do fluxo de usuários reais. [`src/app/(private)/checkout/premium/page.tsx`](../src/app/(private)/checkout/premium/page.tsx)
- Dashboard ainda apresenta ranking/histórico de exemplo e métricas de perfil que precisam ser conferidas com o modelo atual. [`src/app/(private)/dashboard/page.tsx`](../src/app/(private)/dashboard/page.tsx)
- Landing contém números promocionais sem fonte de dados, links `#`, CTA para `/comecar-gratis` inexistente e links legais para `/termos` e `/privacidade` que não têm rotas. [`src/app/page.tsx`](../src/app/page.tsx) e cadastro.

### P2 — Documentação e schema divergentes

A documentação antiga descreve `questoes.ativa/correta/comentario` e tabela `respostas`; o projeto remoto usa `questoes.ativo/gabarito/justificativa` e tabelas `sessoes`/`sessao_questoes`. Atualizar `CLAUDE.md` e a especificação do produto para refletirem o contrato atual. Três migrations históricas estão representadas por placeholders sem SQL original; a baseline atual permite reset local, mas não recupera o histórico de implementação. [`supabase/migrations/`](../supabase/migrations/).

## Desempenho

- A landing inteira é Client Component apesar de a maior parte ser conteúdo estático; transformar conteúdo em Server Component e usar `Link` para navegação reduzirá hidratação e JavaScript.
- O middleware chama `auth.getUser()` em praticamente todas as rotas, inclusive páginas públicas. Restringir o matcher às rotas que precisam renovar/verificar sessão, preservando o refresh exigido pelo Supabase.
- A seleção de questões usa `ORDER BY random()`. É simples para o volume atual, mas tende a ordenar/varrer a população elegível inteira; medir com `EXPLAIN ANALYZE` quando o banco crescer e substituir por seleção aleatória escalável.
- Índices atuais já cobrem banca, matéria, ano, cargo, sessão por usuário/data e ordem de questão. Evitar adicionar índices sem plano de consulta/medição.
- A fonte externa em [`src/app/(public)/cadastro/layout.tsx`](../src/app/(public)/cadastro/layout.tsx) gera warning do ESLint e só carrega nesse segmento. Hospedar fonte local ou centralizar com a estratégia suportada pelo Next.
- `supabase/config.toml` referencia `supabase/seed.sql`, mas o arquivo não existe; `supabase db reset` reporta `no files matched pattern`. Criar seed local versionado ou desativar seed até existir.

## Controles de segurança confirmados

- `profiles`, `sessoes` e `sessao_questoes` têm RLS no schema observado; o perfil tem policy por `auth.uid()` e sessões são do usuário dono.
- Questões ativas podem ser lidas sem revelar gabarito/justificativa. Teste remoto confirmou leitura pública de enunciado/alternativas e negou leitura direta de `gabarito`.
- Execução das RPCs está restrita a `authenticated`; teste remoto confirmou que a anon key recebe `42501` ao chamar `iniciar_sessao`.
- RPCs são `SECURITY DEFINER`, usam `search_path = ''`, verificam `auth.uid()` e a propriedade/pertinência da sessão/questão.
- Nenhuma service-role key foi encontrada no código inspecionado; a chave anon usada no browser é pública por definição e depende de RLS.

## Validação executada

- `npx supabase db reset`: passou com todas as migrations locais.
- Teste SQL transacional local: gabarito ausente antes da resposta, entrada multi-caractere rejeitada, correção retornada após resposta e retry idempotente; fixture revertida com rollback.
- Teste da API remota com anon key: matérias/questões legíveis; gabarito negado; execução de RPC negada.
- `npx supabase db lint --schema public`: sem erros.
- `npx supabase db push --dry-run --remote`: remoto atualizado.
- `npm run build`: passou.
- `npm run lint`: zero erros e uma warning sobre fonte externa no layout de cadastro.
- `npm audit`: 31 vulnerabilidades; priorizar correção das críticas/altas.

## Próxima ordem recomendada

1. Atualizar Next e dependências vulneráveis com changelog, `npm audit`, build e teste de auth/quiz.
2. Confirmar políticas/bucket Storage e corrigir tratamento de erro do cadastro.
3. Implementar redefinição de senha real e testes automatizados para RPCs/RLS.
4. Atualizar documentação do schema e remover/ocultar telas demonstrativas fora do escopo v0.
5. Implementar estatísticas reais por matéria a partir das sessões e validar end-to-end com uma conta de teste.
6. Otimizar landing/middleware e seleção aleatória com medições; adicionar monitoramento de erros e Web Vitals antes de escalar.

## Limitações desta auditoria

Não foi possível verificar configurações do painel hospedado que não fazem parte do schema exportado (SMTP, MFA/CAPTCHA, domínios de redirect, headers/CDN e políticas/bucket concretos do Storage). O fluxo completo foi exercitado com RPCs no banco local e verificações de permissão na API remota; não foi feito um login E2E em navegador com usuário real.
