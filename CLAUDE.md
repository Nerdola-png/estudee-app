# CLAUDE.md — Estudee

Plataforma web de simulados gamificados para concursos públicos, com questões de provas anteriores, comentário gerado por IA, pontuação calculada no servidor e ranking.

Este arquivo é a fonte de verdade para o Claude Code. Se um pedido conflitar com ele, avise antes de implementar. Itens marcados **(em aberto)** não devem ser assumidos: pergunte.


## 1. Documentos e qual vale mais

Este arquivo substitui o antigo `CLAUDE2.md`, o relatório de pontuação e a auditoria de 2026-11-06 (removidos do repositório). As decisões de produto e de segurança desses documentos estão incorporadas nas seções 4, 5 e 7.

1. `supabase/migrations/` — **fonte de verdade do schema e das regras no banco.**
2. Este arquivo — regras de produto e de código.
3. `AGENTS.md` — o Next.js deste projeto tem mudanças em relação ao que você conhece. Leia o guia relevante em `node_modules/next/dist/docs/` antes de mexer em rota, middleware ou cache.

**Desatualizado (não seguir):** `src/docs/Estudee_Especificacao_Produto.docx` (ainda fala em "10 pontos por acerto", `respostas`, `logs_acesso`, e anúncios).

## 2. Produto

O usuário monta um simulado (filtros → tamanho), responde questão por questão, vê correção e comentário logo após cada resposta e, **ao finalizar**, vê seus pontos, acertos e desempenho por matéria. Os pontos alimentam o ranking.

Diferenciais: pontuação variável (dificuldade, tempo, sequência de acertos), streak diário de estudo (planejado, ainda não implementado), ranking local/estadual/nacional e comentário explicativo em cada questão, gerado por um agente de IA.

**Planos** (valores e limites vivem no banco, em `planos_config`, nunca no código):

| | Gratuito | Premium |
|---|---|---|
| Tamanhos de simulado | 10, 20, 30, 40 | 10 a 40, mais 50, 60, 70, 80, 90, 100 |
| Pontos acumulam | sim | sim |
| Ver a lista do ranking (nacional, UF, município) | não | sim |
| Ver a própria posição (limitada) | sim | sim |

Premium vende **recursos adicionais da plataforma**, nunca "acesso a um banco de questões exclusivo" (direitos autorais). Vale para landing, checkout e qualquer texto de UI.

**Regras de texto público (landing, metadata, termos, UI):**
- A proposta é "questões comentadas de provas anteriores para concursos públicos". O comentário é chamado apenas de "comentário", sem o adjetivo "original".
- Não é necessário dizer que o comentário é gerado por IA, mas **nenhum texto pode afirmar autoria humana**: evitar "da equipe", "feitos por quem já passou", "por aprovados", "curadoria de especialistas".
- Não citar BM-RS, PC-RS ou Brigada Militar como foco do produto. Não prometer funcionalidade que o app não tem **e que não esteja planejada**. O streak diário e os filtros por cargo e estado são planejados, então o `LeftPanel` (login e cadastro) pode anunciá-los; anúncios no plano gratuito ainda dependem de decisão.

**Foco de conteúdo:** concursos públicos para carreiras **jurídicas, policiais, bancárias e outras de nível médio e superior**. Não há restrição a um órgão ou estado específico.

Lacunas do schema para esse foco: `carreiras` e `cargos` só têm `nome` e `slug` (não existe campo de **nível de escolaridade**, médio ou superior), e a tela de filtros hoje só filtra por banca e matéria. Filtros por carreira, cargo, nível, ano e estado são **fatias futuras**: propor plano e migration antes de implementar.

## 3. Fluxo do usuário e rotas

`/filtros` → `/estudar?sessao=<uuid>` → `/resultado?sessao=<uuid>`

- `/estudar` **é** a tela do simulado (não existe `/simulado`; o middleware ainda lista esse prefixo).
- Sem `?sessao=`, `/estudar` retoma a sessão em andamento (`obter_sessao_em_andamento`) ou orienta a criar uma nova.
- Rotas privadas: `/dashboard`, `/estudar`, `/filtros`, `/resultado`, `/ranking`, `/perfil`, `/estatisticas`, `/checkout/premium`, `/auth/reset-password`.
- Rotas públicas: `/`, `/login`, `/cadastro`, `/termos`, `/privacidade`.

## 4. Pontuação (versão 1)

Calculada **no Postgres**, a cada resposta, pela função pura `calcular_pontos` (IMMUTABLE, sem acesso a tabelas). **Exibida ao usuário somente após `finalizar_sessao` + `obter_resultado`.**

```
pontos = base × (1 + bonus_tempo) × mult_sequencia      (só para acertos; erro vale 0, sem negativo)

base           = 100 × peso_dificuldade                  (peso de 1 a 3)
bonus_tempo    = 0,10 × max(0, 1 − t / t_ref)            (0 se t > 3 × t_ref)
mult_sequencia = min(1 + 0,1 × (sequencia − 1), 1,5)
```

Regras:
- `t` é medido **no servidor** (`exibida_em` → resposta). O tempo enviado pelo client é só informativo (`registrar_tempo_ativo`) e **nunca** entra na fórmula.
- `t_ref_segundos` é por questão (vem do CSV/seed; padrão 30). Evoluir para a mediana real dos usuários é **(em aberto)**.
- `sequencia` = acertos seguidos dentro da sessão, na ordem de resposta no servidor; zera no erro. **Não confundir com o streak diário** (dias consecutivos de estudo; seção 7).
- O cálculo ocorre uma vez, na primeira resposta; retries devolvem o resultado já gravado.
- Cada resposta grava os componentes (`pontos_base`, `bonus_tempo`, `mult_sequencia`, `pontos`) e `formula_versao`. Mudar a fórmula = nova versão, nunca sobrescrever a antiga.
- **Anti-farm:** só o **primeiro acerto de cada questão por usuário** pontua no ranking (`questoes_pontuadas`, PK `user_id + questao_id`).
- Questão `anulada` conta como acerto após uma alternativa válida e exibe aviso.
- A UI do simulado **nunca** mostra pontos, "+N pts" ou placar parcial. Mostra progresso, contador de tempo cumulativo e neutro, e correção/comentário. Evitar texto que sugira velocidade.

## 5. Arquitetura e segurança (não negociável)

1. **Correção no servidor.** Gabarito e comentário só saem pela RPC `responder_questao`, depois de o usuário responder. `questoes.gabarito` e `justificativa` não têm grant de leitura.
2. **Pontos, sessões, assinaturas e ranking não são lidos direto pelo client.** Tudo passa por RPC `SECURITY DEFINER` com `set search_path = ''`, validação de `auth.uid()`, `REVOKE` de `public`/`anon` e `GRANT` explícito.
3. **Plano vem de `plano_atual_usuario()`** (tabela `assinaturas`, status e `periodo_fim`). `profiles.plano` é legado: não ler, não editar, não autorizar nada com ele.
4. **Ranking e limites de plano são bloqueados no banco**, não só na UI (tamanho do simulado validado em `iniciar_sessao` contra `planos_config`).
5. **Ranking exige opt-in explícito** (`ranking_opt_in`, com nickname, UF e município preenchidos). Exibir apenas nickname e pontuação.
6. **Service role** só em servidor ou scripts locais (`.env.local`). Nunca no browser, nunca com prefixo `NEXT_PUBLIC_`. No client, só a anon key.
7. **Tabelas novas:** RLS ligado e grants explícitos desde a migration (`auto_expose_new_tables = false` já está no `config.toml`).
8. **Premium é Pix manual, fora do app.** A equipe confirma o pagamento e ativa com `npm run pix:ativar -- <user_id> <dias> <operador_id>` (RPC `registrar_assinatura_pix_manual`, só `service_role`). O client nunca ativa Premium nem informa comprovante, valor ou status.
9. **Não integrar** Stripe, checkout automático ou webhook nesta fase. Antes de cobrar, definir e publicar: chave Pix, valor, prazo, cancelamento, reembolso e canal de atendimento **(em aberto)**.
10. Data fetching em Server Components quando fizer sentido; mutações via RPC ou Server Actions; hooks do TanStack Query em `src/hooks/`.

## 6. Modelo de dados (resumo; detalhes nas migrations)

- Referência: `materias`, `bancas`, `cargos`, `carreiras`, `textos_base`.
- `questoes`: alternativas em JSONB (`key` A–E + `texto`), `gabarito`, `justificativa`, `ativo`, `status_gabarito`, `peso_dificuldade` (1–3), `t_ref_segundos`.
- `sessoes` e `sessao_questoes`: sessões e respostas **append-only** com tempo, sequência e componentes de pontos. Estatísticas derivam só de sessões **finalizadas**.
- `profiles`: dados de conta, `nickname` (único), `ranking_opt_in`, `uf`, `municipio_ibge` (código IBGE de 7 dígitos), avatar.
- `planos_config`, `assinaturas`: plano e tamanhos permitidos.
- `questoes_pontuadas`: controle anti-farm.
- `ranking_pontos`: agregados por usuário e período (`geral`, `semanal`, `mensal`), atualizados na finalização.
- Storage: bucket `avatars`, 2 MB, JPEG/PNG/WebP, policies restritas ao próprio `auth.uid()`.

RPCs principais: `iniciar_sessao`, `carregar_sessao`, `responder_questao`, `registrar_tempo_ativo`, `finalizar_sessao`, `obter_resultado`, `obter_sessao_em_andamento`, `obter_estatisticas`, `obter_minha_posicao`, `obter_ranking`, `plano_atual_usuario`.

Regra: nunca guardar total agregado fora de `ranking_pontos`; estatísticas derivam do histórico de sessões.

## 7. Estado atual (atualize ao concluir cada fatia)

**Pronto:** login, cadastro (com avatar), recuperação e redefinição de senha, filtros com seleção múltipla de bancas e matérias, tamanhos por plano, simulado com retomada e contador de tempo ativo, resultado, dashboard com dados reais, estatísticas por matéria, perfil (nickname, opt-in, UF/município), ranking via RPC, página de Premium (Pix manual, informativa), `/termos` e `/privacidade`, scripts de seed e de ativação Pix, testes SQL de pontuação e acesso.

**PREFERÊNCIA DE GABARITO (corrigido em 13/11):** `responder_questao` foi restaurada a partir da versão pontuada de 07/11 (`20261113000000` corrige a `20261112000000`, que já estava aplicada em produção e criava a RPC com colunas inexistentes). Vale de novo: pontos pelo `calcular_pontos` (base, bônus de tempo e multiplicador de sequência), tempo medido no servidor, anti-farm por `questoes_pontuadas` e idempotência (retry devolve o resultado gravado; trocar a resposta é bloqueado). A única novidade é `mostrar_gabarito_agora`, guardada em `sessoes.filtros`: quando falsa, `responder_questao` e `carregar_sessao` não devolvem gabarito/comentário — só a tela de revisão (`obter_revisao`) mostra. `iniciar_sessao` ganhou o parâmetro `p_mostrar_gabarito_agora` e voltou a validar plano e filtros.

**Pendências conhecidas:**
- Logs de acesso com retenção mínima de 5 anos (LGPD/Marco Civil): a tabela `logs_acesso` da `main` não está nas migrations atuais. Recriar e registrar login, início de simulado e encerramento de conta.
- `abandonar_sessoes_inativas()` existe (30 dias) mas **não está agendada**. Código usa o status `abandonado` (documentação antiga dizia `abandonada`; usar `abandonado`).
- `config.toml` aponta para `supabase/seed.sql`, que não existe (quebra `db reset`).
- Teste E2E em navegador com conta real nunca foi feito.
- Termos comerciais do Pix e licenciamento das questões de bancas.
- Pipeline do agente de IA ainda não documentado no repositório (formato de entrega, validações, quem estima `peso_dificuldade` e `t_ref_segundos`).
- 8 vulnerabilidades moderadas só em dev (cadeia do ESLint); manter `npm audit --omit=dev` limpo.
- **Streak diário: mantido no produto, mas não implementado.** Foi removido do schema da `Secondary` (não há mais `streak_dias` nem `streak_ultima_data` em `profiles`), embora o `LeftPanel` já o anuncie ("Sequência de estudos — não deixe o fogo apagar"). Regras em aberto na seção 8. Até haver decisão, **o streak não altera a pontuação**.
- Copy do foco antigo (BM-RS / PC-RS, "curadoria", "comentários da equipe") ainda presente em: lista `CONCURSOS` do cadastro, selo "Curadoria" e bloco "evitando volume vazio" em `/filtros`, trecho sobre comentários em `/termos` e a mensagem de erro do `importar-questoes.mjs`. Landing e metadata do site já foram atualizados.

## 8. Decisões em aberto

1. Anúncios no plano gratuito (previstos na especificação antiga; o texto antigo do CLAUDE proibia). **Não construir** até decidir.
2. Regras do streak diário (estilo Duolingo): o que conta como dia de estudo (responder ao menos uma questão ou finalizar um simulado), fuso horário (sugestão: America/Sao_Paulo), quando a sequência quebra, se há tolerância, se o streak influencia pontos ou ranking, e onde guardar (colunas em `profiles` ou tabela própria).
3. Posição de gratuitos: incluí-los no cálculo e restringir só a visualização é a recomendação atual.
4. Período padrão do ranking (geral, semanal ou mensal).
5. Reresolução de questão: hoje vale 0 no ranking; confirmar se deve valer valor reduzido.
6. Prazo de abandono e se respostas parciais consolidam pontos.
7. Origem da dificuldade: fixa no seed ou derivada da taxa de acerto.
8. Limite diário de questões para gratuitos.
9. Manter ou não o contador de sequência visível durante o simulado.
10. Revisão humana dos comentários antes de ativar a questão e canal de reporte de erro (seção 11).
11. Filtros por carreira, cargo, nível de escolaridade, ano e estado, e o modelo de dados do nível (seção 2).

## 9. Fora de escopo até decisão

- Anúncios, comunidade dentro do app, CMS, gateway de pagamento, PWA, apps Android/iOS.

## 10. Convenções de código

- TypeScript strict. Proibido `any`. Tipos do Supabase em `src/types/database.ts`, **regenerados após qualquer mudança de schema, antes de escrever código que use as tabelas**.
- UI e termos de domínio em PT-BR. Mensagens de erro de auth traduzidas.
- Pastas de rota em kebab-case; grupos `(public)` e `(private)`.
- Componentes em `src/app/components/` (`ui/` para shadcn e primitivos, raiz para custom). Pequenos e focados; extrair só com duplicação real.
- Formulários: React Hook Form + Zod; schemas em `src/schema/`.
- Estilo: só Tailwind v4 com os tokens de `globals.css` (`bg-surface`, `text-muted`, `bg-accent`...). Fontes via `next/font` (`font-bebas`, `font-sans`). Sem CSS inline nem arquivos CSS novos.
- Enunciado e comentário renderizados como markdown leve.
- Antes de criar rota ou componente, ler a skill relevante em `.claude/skills/` (`nova-rota`, `rota-layout-page`, `componentes-ui`, `react-hook-form`, `tanstack-query`, `frontend-design`).

## 11. Conteúdo e pipeline

**Origem das questões:** provas públicas já aplicadas. Toda questão exibida identifica banca e concurso de origem.

**Comentários (`justificativa`):** gerados por um **agente de IA** que coleta as questões de provas anteriores e produz o comentário de cada uma. O agente fica **fora deste repositório**; o contrato com o app é o CSV abaixo.

Regras para o agente e para o app:
- O gabarito vem da prova oficial da banca. O agente **nunca infere nem inventa gabarito**; se o gabarito oficial é desconhecido ou inconsistente, a questão entra com o `status_gabarito` correspondente e **não fica ativa**.
- O comentário deve ser texto próprio, explicativo e coerente com o gabarito. **Nunca copiar** gabarito comentado de outras plataformas (QConcursos, Gran, TEC etc.).
- Questão anulada entra com `status_gabarito = anulada`.
- Questão ativa exige status de gabarito definitivo (ou anulada) e comentário preenchido; o seed rejeita o CSV inteiro se houver violação.

**Decidido:** a interface não precisa indicar que o comentário é gerado por IA (ver regras de texto público na seção 2).

**Em aberto (decidir antes de abrir para usuários reais):**
- Haverá revisão humana (total ou por amostragem) dos comentários antes de `ativo = true`? Comentário de IA errado em questão paga é risco de produto.
- Canal para o usuário reportar comentário ou gabarito errado.

**Entrada no banco:** CSV → `npm run seed -- <arquivo.csv>` (usa service role local). Colunas: `codigo`, `foco`, `tipo`, `banca_slug`, `materia_slug`, `cargo_slug`, `carreira_slug`, `estado_prova`, `ano`, `enunciado`, `alternativas`, `gabarito`, `justificativa`, `justificativa_alternativas`, `ativo`, `peso_dificuldade`, `t_ref_segundos`, `status_gabarito`.
- O script valida o CSV inteiro antes de importar, em lotes idempotentes por `codigo`.
- Ele **não cria** dados de referência: bancas, matérias, cargos e carreiras precisam existir antes. Slugs opcionais podem ficar vazios.
- `peso_dificuldade` (1 a 3) e `t_ref_segundos` também vêm do CSV; definir quem os estima (agente ou regra) é **(em aberto)**, pois alimentam a pontuação.

## 12. Comandos

- `npm run dev` / `npm run build` / `npm run lint`
- `npx supabase migration new <nome>` — nova migration
- `npx supabase migration up` — aplicar migrations locais sem reset
- `npx supabase gen types typescript > src/types/database.ts` — regenerar tipos
- `npx supabase db lint --schema public` — validar o schema
- `npx supabase db query --file supabase/tests/scoring_and_access.sql` — testes SQL de pontuação e grants
- `npx supabase db query --file supabase/tests/responder_questao_scoring.sql` — testes SQL de `responder_questao` (pontuação no servidor, idempotência, anti-farm, preferência de gabarito, revisão e grants)
- `npm run seed -- <arquivo.csv>` — importar questões
- `npm run pix:ativar -- <user_id> <dias> <operador_id>` — ativar Premium após confirmar o Pix

## 13. Fluxo de trabalho

- Uma fatia vertical por vez, não o app inteiro.
- Mudança grande, ou que toque schema, pontuação, autenticação, planos ou ranking: **propor plano e esperar confirmação** antes de editar.
- Mudança de schema exige: migration versionada, regeneração de tipos e testes das RPCs/RLS afetadas.
- Toda RPC nova segue a seção 5 (item 2) e tem teste de grants (`anon` deve receber `42501`).
- Ao mexer na fórmula, atualizar a seção 4 e os testes de `calcular_pontos` (acerto instantâneo, em `t_ref`, acima de 3× `t_ref`; sequências de 1, 3 e 7; erro no meio da sequência).
- Ao concluir uma fatia, atualizar a seção 7.

## 14. Glossário

- **Banca:** organizadora da prova (FGV, CEBRASPE, FUNDATEC...)
- **Matéria:** disciplina (Direito Penal, Português...)
- **Gabarito:** alternativa correta
- **Justificativa / comentário:** explicação da questão gerada pelo agente de IA
- **Sessão / simulado:** conjunto de N questões gerado pelos filtros
- **Sequência:** acertos seguidos dentro de uma sessão (multiplicador de pontos)
- **Streak diário / sequência de estudos:** dias consecutivos em que o usuário estudou (planejado; não confundir com a sequência de acertos)
- **Peso de dificuldade:** 1 a 3, define a base de pontos
- **t_ref:** tempo de referência da questão, usado no bônus de tempo
- **Anti-farm:** só o primeiro acerto de cada questão pontua
