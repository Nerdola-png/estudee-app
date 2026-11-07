drop function if exists public.aplicar_evento_assinatura(
  text,
  text,
  jsonb,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  timestamptz,
  uuid
);

drop table public.eventos_pagamento;

drop index if exists public.assinaturas_provider_subscription_key;

alter table public.assinaturas
  drop constraint if exists assinaturas_origem_check,
  drop column if exists provedor,
  drop column if exists provedor_cliente_id,
  drop column if exists provedor_assinatura_id,
  add constraint assinaturas_origem_check
    check (origem in ('pix_manual', 'admin'));

alter table public.planos_config
  drop column if exists provedor_preco_id,
  drop column if exists periodicidade;

comment on table public.assinaturas is
  'Plano efetivo do usuário. Premium é ativado manualmente após confirmação do Pix pela equipe; clientes não têm acesso de escrita.';
comment on column public.assinaturas.ativado_por is
  'Operador que confirmou e registrou manualmente a ativação do Premium.';
comment on column public.assinaturas.origem is
  'Origem administrativa da ativação: Pix manual confirmado ou ajuste interno.';
