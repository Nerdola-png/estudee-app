-- Migration: remove a sobrecarga ambigua de iniciar_sessao
-- Date: 2026-11-14
--
-- A 20261112000000 ja estava aplicada em producao e criou
-- `iniciar_sessao(integer, integer[], integer[], boolean)`. A 20261113000000
-- reescreveu a RPC com `smallint[]` no lugar de `integer[]`, mas
-- CREATE OR REPLACE so substitui a funcao de assinatura identica: a
-- sobrecarga antiga continuou existindo ao lado da nova.
--
-- O PostgREST nao consegue escolher entre as duas, porque os nomes dos
-- parametros sao iguais e so os tipos dos arrays diferem. A chamada falhava
-- com PGRST203 ("Could not choose the best candidate function between..."),
-- impedindo qualquer simulado de comecar.
--
-- A correcao remove a sobrecarga legada, dejando apenas uma `iniciar_sessao`.
-- Como o PostgREST nao desambigua overloads, nenhuma RPC do app pode ter mais
-- de uma assinatura; o teste em supabase/tests/responder_questao_scoring.sql
-- verifica isso.

DROP FUNCTION IF EXISTS public.iniciar_sessao(integer, integer[], integer[], boolean);