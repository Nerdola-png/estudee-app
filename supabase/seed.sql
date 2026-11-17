-- ============================================================================
-- supabase/seed.sql
-- Dados de referência (seed) carregados após as migrations em `supabase db reset`.
-- Idempotente: pode ser executado múltiplas vezes sem duplicar registros.
-- ============================================================================
-- Tabelas de referência populadas aqui:
--   - bancas
--   - materias
--   - cargos
--   - carreiras
--
-- planos_config NÃO é populado aqui (já vem na migration
-- 20261107100000_prepare_scoring_and_rankings.sql).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Bancas (organizações examinadoras)
-- ----------------------------------------------------------------------------
insert into public.bancas (nome, slug) values
  ('Cesgranrio', 'cesgranrio'),
  ('FCC', 'fcc'),
  ('Cebraspe', 'cebraspe'),
  ('FGV', 'fgv'),
  ('Instituto AOC', 'instituto_aoc'),
  ('IBFC', 'ibfc'),
  ('Consulplan', 'consulplan'),
  ('IADES', 'iades'),
  ('Quadrix', 'quadrix'),
  ('Vunesp', 'vunesp'),
  ('Funrio', 'funrio'),
  ('Idib', 'idib')
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- Matérias (disciplinas)
-- ----------------------------------------------------------------------------
insert into public.materias (nome, slug) values
  ('Língua Portuguesa', 'portugues'),
  ('Matemática', 'matematica'),
  ('Raciocínio Lógico', 'raciocinio_logico'),
  ('Informática', 'informatica'),
  ('Estatuto da Criança e do Adolescente', 'estatuto_crianca_adolescente'),
  ('Legislação Especial', 'legislacao_especial'),
  ('Atualidades', 'atualidades'),
  ('Ética no Serviço Público', 'etica_servico_publico'),
  ('Noções de Direitos Humanos', 'direitos_humanos'),
  ('Direito Constitucional', 'direito_constitucional'),
  ('Direito Administrativo', 'direito_administrativo'),
  ('Direito Civil', 'direito_civil'),
  ('Direito Processual Civil', 'direito_processual_civil'),
  ('Direito Penal', 'direito_penal'),
  ('Direito Processual Penal', 'direito_processual_penal'),
  ('Direito do Trabalho', 'direito_do_trabalho'),
  ('Direito Processual do Trabalho', 'direito_processual_do_trabalho'),
  ('Direito Tributário', 'direito_tributario'),
  ('Direito Eleitoral', 'direito_eleitoral'),
  ('Direito Ambiental', 'direito_ambiental'),
  ('Direito Financeiro', 'direito_financeiro'),
  ('Contabilidade', 'contabilidade'),
  ('Administração Pública', 'administracao_publica'),
  ('Gestão Pública', 'gestao_publica'),
  ('Direito Internacional Público', 'direito_internacional_publico')
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- Cargos (posições/cargos do concurso)
-- ----------------------------------------------------------------------------
insert into public.cargos (nome, slug) values
  ('Analista', 'analista'),
  ('Técnico', 'tecnico'),
  ('Auditor', 'auditor'),
  ('Fiscal', 'fiscal'),
  ('Procurador', 'procurador'),
  ('Delegado', 'delegado'),
  ('Oficial', 'oficial'),
  ('Soldado', 'soldado'),
  ('Agente', 'agente'),
  ('Inspetor', 'inspetor'),
  ('Analista Judiciário', 'analista_judiciario'),
  ('Técnico Judiciário', 'tecnico_judiciario')
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- Carreiras (áreas/categorias funcionais)
-- ----------------------------------------------------------------------------
insert into public.carreiras (nome, slug) values
  ('Jurídica', 'juridica'),
  ('Policial', 'policial'),
  ('Bancária', 'bancaria'),
  ('Administrativa', 'administrativa'),
  ('Tributária', 'tributaria'),
  ('Trabalhista', 'trabalhista'),
  ('Legislativa', 'legislativa'),
  ('Diplomática', 'diplomatica'),
  ('Saúde', 'saude'),
  ('Educação', 'educacao')
on conflict (slug) do nothing;