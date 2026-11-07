# Relatório de mudanças: pontuação, sessões, ranking e premium

Data: 06/11/2026. Base: auditoria do projeto de 06/11/2026 e decisões de produto tomadas na conversa de análise.

## 1. Objetivo

Este relatório lista as mudanças de código, banco e produto necessárias para implementar o diferencial do simulado gamificado: pontuação variável calculada no servidor, sessões com tamanhos por plano, ranking local, estadual e nacional restrito a premium e ativação de premium por pagamento de terceiros (Stripe), com a integração preparada para ser ligada depois. Ele complementa os achados P0/P1/P2 da auditoria, que continuam válidos e são pré-requisito para publicar.

## 2. Decisões de produto fechadas

| Tema | Decisão |
| --- | --- |
| Pontuação | Variável, calculada no servidor a cada resposta, exibida ao usuário somente ao final do simulado |
| Erros | Valem 0 ponto, sem pontuação negativa |
| Tempo | Sem limite para concluir; contador cumulativo da sessão, neutro, visível ao usuário |
| Peso do tempo | Baixo: bônus de no máximo 10% sobre acertos |
| Sequência | Multiplicador por acertos seguidos, com teto de 1,5x, calculado por sessão |
| Tamanhos (gratuito) | 10, 20, 30 ou 40 questões |
| Tamanhos (premium) | 10 a 40 mais 50, 60, 70, 80, 90 ou 100 questões |
| Ranking | Local, estadual e nacional; visível apenas para premium; gratuitos também acumulam pontos |
| Anti-farm | Apenas o primeiro acerto de cada questão por usuário pontua no ranking |
| Premium | Pagamento por terceiros (Stripe): camada de pagamento preparada agora, integração ligada depois do v0 |

## 3. Fórmula de pontuação (versão 1)

Aplicada somente a acertos; erro vale 0.

```
pontos = base × (1 + bonus_tempo) × mult_sequencia

base           = 100 × peso_dificuldade           (peso de 1 a 3)
bonus_tempo    = 0,10 × max(0, 1 − t / t_ref)     (0 se t > 3 × t_ref)
mult_sequencia = min(1 + 0,1 × (sequencia − 1), 1,5)
```

Regras de apoio:

- `t` é medido no servidor: diferença entre `exibida_em` e o momento da resposta. O tempo informado pelo client nunca entra no cálculo.
- `t_ref` é por questão. Começa como estimativa pelo tamanho do enunciado e das alternativas e passa à mediana real dos usuários quando houver amostra (por exemplo, 30 respostas).
- `sequencia` é contada pela ordem de resposta no servidor, dentro da sessão, e zera no erro.
- O cálculo ocorre uma única vez, na primeira resposta; retries devolvem o resultado já gravado.
- Cada resposta grava os componentes (`pontos_base`, `bonus_tempo`, `mult_sequencia`, `pontos`) e a `formula_versao`, para permitir ajuste e recálculo futuro.

## 4. Mudanças no banco de dados (migrations)

Cada item deve virar migration versionada, com grants explícitos e RLS desde a criação.

### 4.1 Configuração de planos

- Criar `planos_config` com: plano (`gratuito`, `premium`), `tamanhos_permitidos` (array de inteiros) e `ranking_visivel` (booleano). Os tamanhos por plano ficam em dados, não no código da função.
- Leitura permitida a `authenticated` (a interface precisa listar os tamanhos); escrita sem grant para clientes.

### 4.2 Perfil e plano

- Em `profiles`, adicionar: `nickname` (único), `ranking_opt_in`, `uf` e `municipio_ibge` (código IBGE, não texto livre).
- Proteger o plano contra edição pelo usuário. Preferência: tabela separada `assinaturas` (usuário, plano, status, início, fim, `ativado_por`, método `pix_manual`) como fonte da verdade, em vez de coluna editável em `profiles`. Se o plano ficar em `profiles`, aplicar grant de update por coluna excluindo essa coluna e um trigger que bloqueie alteração por `authenticated`.
- Revisar as policies de update de `profiles` para que o usuário altere apenas campos permitidos.

### 4.3 Questões

- Adicionar `peso_dificuldade` (1 a 3, com constraint) e `t_ref_segundos` (estimativa inicial, depois atualizada por rotina).
- Manter `gabarito` e justificativas sem grant de leitura, como já está.

### 4.4 Sessões

- Em `sessoes`, adicionar: `status` (`em_andamento`, `finalizada`, `abandonada`), `tamanho`, `pontos_total`, `acertos`, `tempo_ativo_segundos`, `ultima_atividade_em` e `finalizada_em`.
- Sem grant de leitura direta para `pontos_total` enquanto a sessão não estiver finalizada; a leitura ocorre pela RPC de resultado.

### 4.5 Respostas por questão

- Em `sessao_questoes`, adicionar: `exibida_em`, `respondida_em`, `tempo_servidor_ms`, `tempo_valido`, `tempo_ativo_segundos` (informativo, vindo do client), `correta`, `sequencia`, `pontos_base`, `bonus_tempo`, `mult_sequencia`, `pontos`, `pontua_ranking` e `formula_versao`.
- Sem grant de leitura direta nas colunas de pontos.

### 4.6 Anti-farm

- Criar tabela de controle (por exemplo, `questoes_pontuadas`) com chave primária (`user_id`, `questao_id`). A inserção ocorre no primeiro acerto; se a chave já existir, a resposta grava `pontua_ranking = false` e pontos 0 para o ranking (ou valor reduzido, conforme decisão da seção 10).

### 4.7 Agregados e ranking

- Criar tabela agregada de pontos por usuário (total e por período, com `uf` e `municipio_ibge` copiados do perfil), atualizada na finalização da sessão. Alternativa: view materializada atualizada periodicamente.
- Índices por região e por período (nacional, UF, município), planejados com `EXPLAIN ANALYZE`.
- Nenhum acesso direto de clientes a essa tabela; leitura só por RPC.

## 5. Mudanças nas RPCs

Todas `SECURITY DEFINER`, com `search_path = ''`, verificação de `auth.uid()`, `REVOKE` de `public` e `anon` e `GRANT` apenas a `authenticated` (as de admin, nem isso).

| RPC | Mudança |
| --- | --- |
| `calcular_pontos` (nova, função pura) | Recebe correta, peso, tempo, `t_ref`, sequência e versão; devolve os componentes. `IMMUTABLE`, sem acesso a tabelas, testável isoladamente |
| `iniciar_sessao` (alterar) | Receber o tamanho; validar contra `planos_config` e o plano real do usuário; priorizar questões ainda não respondidas; definir comportamento quando os filtros retornam menos questões que o pedido (erro claro ou sessão menor, de forma explícita) |
| `carregar_sessao` (alterar) | Gravar `exibida_em` da questão atual ao entregá-la e regravar ao retomar a sessão; atualizar `ultima_atividade_em`; nunca devolver pontos |
| `responder_questao` (alterar) | Calcular tempo no servidor, sequência e pontos uma única vez; aplicar anti-farm; gravar componentes e versão; manter idempotência do retry; não devolver pontos nem posição |
| `registrar_tempo_ativo` (nova) | Persistir o contador do client para sobreviver à retomada; valor apenas informativo, nunca usado em regra de pontuação |
| `finalizar_sessao` (nova) | Validar propriedade e estado; consolidar `pontos_total`, `acertos` e tamanho; atualizar agregados do ranking; marcar `finalizada` |
| `obter_resultado` (nova) | Devolver pontos, acertos, média por questão e agrupamento por matéria, somente para sessão finalizada do próprio usuário |
| `obter_ranking` (nova) | Verificar plano premium no banco; aceitar escopo (nacional, UF, município) e período; devolver apenas nickname e dados autorizados (opt-in) |
| `obter_minha_posicao` (nova) | Disponível a todos os planos, com apresentação limitada para gratuitos (base do gatilho de conversão); atualiza apenas na finalização |
| `ativar_premium` (nova, interna) | Sem acesso por `authenticated`; chamada apenas pelo tratamento de webhook do provedor de pagamento (6.1) ou por admin como fallback manual, sempre no servidor com service-role e sem expor a chave ao client; idempotente e registra a origem, quem ativou e quando |
| Rotina de abandono (nova) | Via `pg_cron`: sessão sem atividade por 7 ou 30 dias vira `abandonada`; consolidar as respostas já dadas (decisão a confirmar) |

## 6. Segurança e configuração

- Definir `auto_expose_new_tables` como desativado em `supabase/config.toml` e exigir grants explícitos e RLS em todas as tabelas novas (item P1 da auditoria).
- Garantir que nenhuma coluna de pontos, posição ou plano seja legível ou editável diretamente por `authenticated`.
- Bloquear o ranking no banco, não só na interface.
- Nunca usar service-role no código do browser.
- Confirmar bucket e policies de Storage para avatar, restritas ao `auth.uid()`, com validação de tipo MIME e tamanho (item P1 da auditoria).
- Registrar `formula_versao` em todas as respostas pontuadas.

### 6.1 Preparação para pagamento via Stripe

O pagamento do premium será feito por um provedor terceiro, como o Stripe. O v0 não chama o provedor, mas a estrutura abaixo deixa o ponto de integração pronto para ser ligado depois, sem refatorar plano, ranking nem RPCs. A regra central: o plano premium só é concedido por evento confirmado do provedor, processado no servidor, nunca pelo client.

**Camada de código (preparada agora)**

- Interface `PaymentProvider` em `src/lib/payments/`, com os métodos `criarCheckout`, `criarPortalCliente` e `tratarWebhook`.
- Duas implementações: `stripe.ts` (stub que retorna "não configurado" até a integração) e `manual.ts` (fallback de ativação por admin, enquanto o Stripe não estiver ligado).
- Flag por variável de ambiente (`PAYMENT_PROVIDER` e `PAYMENTS_ENABLED`); com a flag desligada, o checkout exibe "indisponível".
- Rotas server-side: `POST /api/payments/checkout` (exige usuário autenticado; o preço vem do servidor, nunca do client), `POST /api/payments/webhook` e, opcionalmente, `POST /api/payments/portal` (gerenciar ou cancelar assinatura).
- Variáveis de ambiente (chave secreta, segredo do webhook, IDs de preço) documentadas em `.env.example`, nunca com prefixo `NEXT_PUBLIC_` e nunca no client.

**Banco de dados**

- `assinaturas` ganha: `provedor`, `provedor_cliente_id`, `provedor_assinatura_id`, `status` (ativa, cancelada, inadimplente, expirada), `periodo_fim`, `cancelar_no_fim` e `atualizado_em`.
- Nova tabela `eventos_pagamento` (ID do evento do provedor com restrição de unicidade, tipo, payload e `processado_em`) para idempotência do webhook e auditoria, sem grant para clientes.
- `planos_config` guarda o ID de preço do provedor por plano e periodicidade.
- Função interna `aplicar_evento_assinatura` (generalização de `ativar_premium`): chamada só pelo handler do webhook com service-role, idempotente por ID de evento, concede o plano ao confirmar pagamento e rebaixa ao cancelar ou expirar.
- O plano efetivo do usuário é derivado de uma assinatura ativa e de `periodo_fim`. `iniciar_sessao` e `obter_ranking` leem essa única fonte.

**Eventos a tratar:** checkout concluído, pagamento de fatura bem-sucedido, falha de pagamento, assinatura atualizada ou cancelada, reembolso ou disputa.

**Segurança**

- Validar a assinatura de todo webhook antes de qualquer efeito; rejeitar o que não validar.
- Ignorar eventos duplicados (idempotência por ID do evento).
- Não conceder plano com base no redirecionamento de sucesso do client; só o webhook concede.
- Service-role usada apenas no servidor, nunca exposta.
- Nenhum dado de cartão passa pelo sistema; fica com o provedor.

**Conformidade:** a política de privacidade deve citar o provedor de pagamento como operador de dados; os termos devem trazer preço, renovação, cancelamento e reembolso.

**Testes:** webhook com assinatura inválida rejeitado; evento duplicado não duplica a concessão; cancelamento ou expiração rebaixa o plano; usuário comum não executa a função interna; com a flag desligada, o checkout fica indisponível.

**Pendências para a integração:** confirmar o provedor, os meios de pagamento (cartão e, se disponível no provedor, Pix), a periodicidade (mensal ou anual), período de teste e política de reembolso.

## 7. Mudanças no frontend

### 7.1 Filtros e início de sessão

- Listar tamanhos de `planos_config` conforme o plano; exibir as opções de 50 a 100 como bloqueadas para gratuitos, com convite ao premium.
- Tratar erro de plano insuficiente e de poucas questões elegíveis.

### 7.2 Estudo

- Contador cumulativo da sessão no topo (mm:ss ou hh:mm:ss), sem tempo por questão e sem comparação com média.
- Contar apenas tempo ativo: pausar em `visibilitychange` e ao fechar; retomar do acumulado; enviar `registrar_tempo_ativo` periodicamente e a cada resposta.
- Sem exibir pontos durante a sessão. Opcional: barra de progresso e contador de sequência para manter a sensação de jogo.
- Evitar qualquer texto ou destaque que sugira velocidade.

### 7.3 Resultado

- Chamar `finalizar_sessao` e depois `obter_resultado`; mostrar pontos, acertos, média por questão e agrupamento por matéria.

### 7.4 Ranking

- Nova rota com abas nacional, estadual e local; acesso condicionado ao retorno da RPC (premium).
- Para gratuitos, mostrar a posição limitada e o convite ao premium, conforme decisão da seção 10.
- Substituir o ranking fictício atual e o ranking de exemplo do dashboard.

### 7.5 Perfil e cadastro

- Campos de nickname, UF, município (seleção por lista IBGE) e opt-in de ranking.
- Tratar erros de upload e de `profiles.update` no cadastro e persistir dados opcionais por caminho autorizado (item P1 da auditoria).

### 7.6 Premium e checkout

- Marcar o checkout simulado como indisponível até a integração; criar a tela de checkout real já ligada à camada de pagamento (6.1), sem chamar o Stripe enquanto a integração estiver desativada.
- Exibir o plano real do usuário no perfil.

### 7.7 Estatísticas e telas demonstrativas

- Estatísticas reais por matéria a partir de sessões e respostas, incluindo tempo médio por matéria (usando `tempo_ativo_segundos`).
- Remover ou ocultar dados fictícios restantes em perfil, dashboard e landing.

## 8. Conformidade e conteúdo

- LGPD: ranking público exibe apenas nickname, com opt-in explícito; localização em nível agregado quando possível.
- Criar as rotas `/termos` e `/privacidade`, hoje inexistentes, e corrigir os links da landing.
- Confirmar licenciamento e direitos de uso das questões de bancas, principalmente por o produto ter plano pago.

## 9. Testes necessários

**Função de fórmula (SQL):**

- acerto instantâneo, acerto em `t_ref` e acerto acima de 3x `t_ref`;
- sequências de 1, 3 e 7 acertos;
- erro no meio da sequência;
- erro vale 0.

**RPCs:**

- retry de `responder_questao` não altera pontos nem tempo;
- repetir acerto da mesma questão em outra sessão não pontua no ranking;
- `iniciar_sessao` com tamanho 50 falha para gratuito e funciona para premium;
- filtros com poucas questões elegíveis;
- retomada regrava `exibida_em`;
- `finalizar_sessao` é idempotente e só vale para o dono;
- rotina de abandono.

**RLS e grants:**

- usuário não altera o próprio plano;
- usuário não lê colunas de pontos diretamente;
- gratuito não obtém ranking pela RPC;
- `anon` recebe `42501` em todas as RPCs novas;
- usuário não acessa sessões de outro.

**E2E:** fluxo completo em navegador com conta de teste (limitação reconhecida da auditoria).

## 10. Decisões em aberto

1. **Gratuitos na lista do ranking.** Recomendação: incluí-los nos dados (posição calculada) e restringir apenas a visualização, o que viabiliza a mensagem de conversão ("você está em 1.240º, assine para ver").
2. **Período do ranking.** Acumulado, semanal ou mensal. Recomendação: ao menos um recorte periódico para dar chance a novatos.
3. **Reresolução de questão.** Valor 0 ou reduzido no ranking.
4. **Prazo de abandono.** 7 ou 30 dias, e se pontos de respostas parciais consolidam.
5. **Origem da dificuldade.** Fixa por questão no início; derivar da taxa de acerto real depois.
6. **Limite diário de questões para gratuitos.** Decisão de produto; pode frear engajamento.
7. **Contador de sequência visível.** Manter ou não durante o simulado.
8. **Métrica secundária** de média por questão (mínimo de 10 questões) para comparar sessões de tamanhos diferentes.

## 11. Ordem de implementação sugerida

1. **Base de segurança (P0/P1 da auditoria):** atualizar Next, zod e shadcn; Storage/avatar; redefinição de senha real; `auto_expose_new_tables` desativado.
2. **Modelo de dados:** `planos_config`, plano protegido, colunas de sessão e resposta, tabela anti-farm, perfil com UF/município/nickname.
3. **Pontuação:** função `calcular_pontos`, alteração de `iniciar_sessao`, `carregar_sessao` e `responder_questao`, `finalizar_sessao` e `obter_resultado`, com testes SQL.
4. **Frontend do simulado:** seleção de tamanho por plano, contador, resultado com pontos.
5. **Ranking mínimo:** agregados, visão nacional restrita a premium no banco; depois estadual e local.
6. **Premium real:** camada de pagamento preparada para o Stripe (6.1), `ativar_premium` seguro, checkout marcado como indisponível até lá.
7. **Limpeza e conformidade:** estatísticas reais, remoção de telas fictícias, `/termos`, `/privacidade`, landing.
8. **Documentação:** atualizar `CLAUDE.md` (o escopo v0 passa a incluir pontos e ranking mínimo) e a especificação do produto para o schema atual (`ativo`, `gabarito`, `justificativa`, `sessoes`, `sessao_questoes`); resolver os placeholders das migrations históricas.
9. **Escala:** otimizar seleção aleatória, middleware e landing com medições; adicionar monitoramento de erros e Web Vitals.
