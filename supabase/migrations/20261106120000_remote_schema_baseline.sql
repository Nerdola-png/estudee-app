


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."foco_questao" AS ENUM (
    'concurso',
    'vestibular',
    'oab'
);


ALTER TYPE "public"."foco_questao" OWNER TO "postgres";


CREATE TYPE "public"."sessao_status" AS ENUM (
    'em_andamento',
    'finalizado',
    'abandonado'
);


ALTER TYPE "public"."sessao_status" OWNER TO "postgres";


CREATE TYPE "public"."tipo_questao" AS ENUM (
    'multipla_escolha',
    'certo_errado'
);


ALTER TYPE "public"."tipo_questao" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into public.profiles (id, nome, sobrenome, cidade, estado)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', 'Usuário'),
    coalesce(new.raw_user_meta_data->>'sobrenome', ''),
    coalesce(new.raw_user_meta_data->>'cidade', ''),
    coalesce(new.raw_user_meta_data->>'estado', '')
  );
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."bancas" (
    "id" smallint NOT NULL,
    "nome" "text" NOT NULL,
    "slug" "text" NOT NULL
);


ALTER TABLE "public"."bancas" OWNER TO "postgres";


ALTER TABLE "public"."bancas" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."bancas_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."cargos" (
    "id" smallint NOT NULL,
    "nome" "text" NOT NULL,
    "slug" "text" NOT NULL
);


ALTER TABLE "public"."cargos" OWNER TO "postgres";


ALTER TABLE "public"."cargos" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."cargos_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."carreiras" (
    "id" smallint NOT NULL,
    "nome" "text" NOT NULL,
    "slug" "text" NOT NULL
);


ALTER TABLE "public"."carreiras" OWNER TO "postgres";


ALTER TABLE "public"."carreiras" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."carreiras_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."materias" (
    "id" smallint NOT NULL,
    "nome" "text" NOT NULL,
    "slug" "text" NOT NULL
);


ALTER TABLE "public"."materias" OWNER TO "postgres";


ALTER TABLE "public"."materias" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."materias_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "nome" "text" NOT NULL,
    "sobrenome" "text" NOT NULL,
    "cidade" "text" NOT NULL,
    "estado" "text" NOT NULL,
    "telefone" "text",
    "concurso_alvo" "text",
    "avatar_url" "text",
    "plano" "text" DEFAULT 'gratuito'::"text" NOT NULL,
    "pontuacao" integer DEFAULT 0 NOT NULL,
    "streak_dias" integer DEFAULT 0 NOT NULL,
    "streak_ultima_data" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "profiles_plano_check" CHECK (("plano" = ANY (ARRAY['gratuito'::"text", 'premium'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."questoes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "codigo" "text" NOT NULL,
    "foco" "public"."foco_questao" NOT NULL,
    "tipo" "public"."tipo_questao" NOT NULL,
    "banca_id" smallint NOT NULL,
    "materia_id" smallint NOT NULL,
    "cargo_id" smallint,
    "carreira_id" smallint,
    "estado_prova" "text" NOT NULL,
    "ano" smallint NOT NULL,
    "texto_base_id" "uuid",
    "enunciado" "text" NOT NULL,
    "alternativas" "jsonb" NOT NULL,
    "gabarito" character(1) NOT NULL,
    "justificativa" "text",
    "justificativa_alternativas" "jsonb",
    "ativo" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."questoes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sessao_questoes" (
    "sessao_id" "uuid" NOT NULL,
    "questao_id" "uuid" NOT NULL,
    "ordem" smallint NOT NULL,
    "resposta" character(1),
    "correta" boolean,
    "marcada_revisao" boolean DEFAULT false NOT NULL,
    "respondida_at" timestamp with time zone
);


ALTER TABLE "public"."sessao_questoes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sessoes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "modo" "text" DEFAULT 'simulado'::"text" NOT NULL,
    "filtros" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status" "public"."sessao_status" DEFAULT 'em_andamento'::"public"."sessao_status" NOT NULL,
    "total_questoes" smallint NOT NULL,
    "acertos" smallint,
    "tempo_segundos" integer,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "finished_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."sessoes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."textos_base" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conteudo" "text" NOT NULL,
    "hash" "text" NOT NULL,
    "titulo" "text",
    "fonte" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."textos_base" OWNER TO "postgres";


ALTER TABLE ONLY "public"."bancas"
    ADD CONSTRAINT "bancas_nome_key" UNIQUE ("nome");



ALTER TABLE ONLY "public"."bancas"
    ADD CONSTRAINT "bancas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bancas"
    ADD CONSTRAINT "bancas_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."cargos"
    ADD CONSTRAINT "cargos_nome_key" UNIQUE ("nome");



ALTER TABLE ONLY "public"."cargos"
    ADD CONSTRAINT "cargos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cargos"
    ADD CONSTRAINT "cargos_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."carreiras"
    ADD CONSTRAINT "carreiras_nome_key" UNIQUE ("nome");



ALTER TABLE ONLY "public"."carreiras"
    ADD CONSTRAINT "carreiras_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."carreiras"
    ADD CONSTRAINT "carreiras_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."materias"
    ADD CONSTRAINT "materias_nome_key" UNIQUE ("nome");



ALTER TABLE ONLY "public"."materias"
    ADD CONSTRAINT "materias_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."materias"
    ADD CONSTRAINT "materias_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."questoes"
    ADD CONSTRAINT "questoes_codigo_key" UNIQUE ("codigo");



ALTER TABLE ONLY "public"."questoes"
    ADD CONSTRAINT "questoes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sessao_questoes"
    ADD CONSTRAINT "sessao_questoes_pkey" PRIMARY KEY ("sessao_id", "questao_id");



ALTER TABLE ONLY "public"."sessoes"
    ADD CONSTRAINT "sessoes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."textos_base"
    ADD CONSTRAINT "textos_base_hash_key" UNIQUE ("hash");



ALTER TABLE ONLY "public"."textos_base"
    ADD CONSTRAINT "textos_base_pkey" PRIMARY KEY ("id");



CREATE INDEX "questoes_ano_idx" ON "public"."questoes" USING "btree" ("ano");



CREATE INDEX "questoes_banca_id_idx" ON "public"."questoes" USING "btree" ("banca_id");



CREATE INDEX "questoes_cargo_id_idx" ON "public"."questoes" USING "btree" ("cargo_id");



CREATE INDEX "questoes_carreira_id_idx" ON "public"."questoes" USING "btree" ("carreira_id");



CREATE INDEX "questoes_estado_prova_idx" ON "public"."questoes" USING "btree" ("estado_prova");



CREATE INDEX "questoes_foco_idx" ON "public"."questoes" USING "btree" ("foco");



CREATE INDEX "questoes_materia_id_idx" ON "public"."questoes" USING "btree" ("materia_id");



CREATE INDEX "questoes_tipo_idx" ON "public"."questoes" USING "btree" ("tipo");



CREATE INDEX "sessao_questoes_questao_id_idx" ON "public"."sessao_questoes" USING "btree" ("questao_id") WHERE ("correta" IS FALSE);



CREATE INDEX "sessao_questoes_sessao_id_ordem_idx" ON "public"."sessao_questoes" USING "btree" ("sessao_id", "ordem");



CREATE INDEX "sessoes_user_id_created_at_idx" ON "public"."sessoes" USING "btree" ("user_id", "created_at" DESC);



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."questoes"
    ADD CONSTRAINT "questoes_banca_id_fkey" FOREIGN KEY ("banca_id") REFERENCES "public"."bancas"("id");



ALTER TABLE ONLY "public"."questoes"
    ADD CONSTRAINT "questoes_cargo_id_fkey" FOREIGN KEY ("cargo_id") REFERENCES "public"."cargos"("id");



ALTER TABLE ONLY "public"."questoes"
    ADD CONSTRAINT "questoes_carreira_id_fkey" FOREIGN KEY ("carreira_id") REFERENCES "public"."carreiras"("id");



ALTER TABLE ONLY "public"."questoes"
    ADD CONSTRAINT "questoes_materia_id_fkey" FOREIGN KEY ("materia_id") REFERENCES "public"."materias"("id");



ALTER TABLE ONLY "public"."questoes"
    ADD CONSTRAINT "questoes_texto_base_id_fkey" FOREIGN KEY ("texto_base_id") REFERENCES "public"."textos_base"("id");



ALTER TABLE ONLY "public"."sessao_questoes"
    ADD CONSTRAINT "sessao_questoes_questao_id_fkey" FOREIGN KEY ("questao_id") REFERENCES "public"."questoes"("id");



ALTER TABLE ONLY "public"."sessao_questoes"
    ADD CONSTRAINT "sessao_questoes_sessao_id_fkey" FOREIGN KEY ("sessao_id") REFERENCES "public"."sessoes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sessoes"
    ADD CONSTRAINT "sessoes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Usuário atualiza próprio perfil" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Usuário lê próprio perfil" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."bancas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cargos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."carreiras" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."materias" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."questoes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sessao: dono tudo" ON "public"."sessoes" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."sessao_questoes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sessao_questoes: dono tudo" ON "public"."sessao_questoes" USING ((EXISTS ( SELECT 1
   FROM "public"."sessoes" "s"
  WHERE (("s"."id" = "sessao_questoes"."sessao_id") AND ("s"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."sessoes" "s"
  WHERE (("s"."id" = "sessao_questoes"."sessao_id") AND ("s"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."sessoes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."textos_base" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON TABLE "public"."bancas" TO "service_role";
GRANT SELECT ON TABLE "public"."bancas" TO "anon";
GRANT SELECT ON TABLE "public"."bancas" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."bancas_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."cargos" TO "service_role";
GRANT SELECT ON TABLE "public"."cargos" TO "anon";
GRANT SELECT ON TABLE "public"."cargos" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."cargos_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."carreiras" TO "service_role";
GRANT SELECT ON TABLE "public"."carreiras" TO "anon";
GRANT SELECT ON TABLE "public"."carreiras" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."carreiras_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."materias" TO "service_role";
GRANT SELECT ON TABLE "public"."materias" TO "anon";
GRANT SELECT ON TABLE "public"."materias" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."materias_id_seq" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."profiles" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."questoes" TO "service_role";



GRANT SELECT("id") ON TABLE "public"."questoes" TO "anon";
GRANT SELECT("id") ON TABLE "public"."questoes" TO "authenticated";



GRANT SELECT("codigo") ON TABLE "public"."questoes" TO "anon";
GRANT SELECT("codigo") ON TABLE "public"."questoes" TO "authenticated";



GRANT SELECT("foco") ON TABLE "public"."questoes" TO "anon";
GRANT SELECT("foco") ON TABLE "public"."questoes" TO "authenticated";



GRANT SELECT("tipo") ON TABLE "public"."questoes" TO "anon";
GRANT SELECT("tipo") ON TABLE "public"."questoes" TO "authenticated";



GRANT SELECT("banca_id") ON TABLE "public"."questoes" TO "anon";
GRANT SELECT("banca_id") ON TABLE "public"."questoes" TO "authenticated";



GRANT SELECT("materia_id") ON TABLE "public"."questoes" TO "anon";
GRANT SELECT("materia_id") ON TABLE "public"."questoes" TO "authenticated";



GRANT SELECT("cargo_id") ON TABLE "public"."questoes" TO "anon";
GRANT SELECT("cargo_id") ON TABLE "public"."questoes" TO "authenticated";



GRANT SELECT("carreira_id") ON TABLE "public"."questoes" TO "anon";
GRANT SELECT("carreira_id") ON TABLE "public"."questoes" TO "authenticated";



GRANT SELECT("estado_prova") ON TABLE "public"."questoes" TO "anon";
GRANT SELECT("estado_prova") ON TABLE "public"."questoes" TO "authenticated";



GRANT SELECT("ano") ON TABLE "public"."questoes" TO "anon";
GRANT SELECT("ano") ON TABLE "public"."questoes" TO "authenticated";



GRANT SELECT("texto_base_id") ON TABLE "public"."questoes" TO "anon";
GRANT SELECT("texto_base_id") ON TABLE "public"."questoes" TO "authenticated";



GRANT SELECT("enunciado") ON TABLE "public"."questoes" TO "anon";
GRANT SELECT("enunciado") ON TABLE "public"."questoes" TO "authenticated";



GRANT SELECT("alternativas") ON TABLE "public"."questoes" TO "anon";
GRANT SELECT("alternativas") ON TABLE "public"."questoes" TO "authenticated";



GRANT SELECT("ativo") ON TABLE "public"."questoes" TO "anon";
GRANT SELECT("ativo") ON TABLE "public"."questoes" TO "authenticated";



GRANT SELECT("created_at") ON TABLE "public"."questoes" TO "anon";
GRANT SELECT("created_at") ON TABLE "public"."questoes" TO "authenticated";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."sessao_questoes" TO "anon";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."sessao_questoes" TO "authenticated";
GRANT ALL ON TABLE "public"."sessao_questoes" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."sessoes" TO "anon";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."sessoes" TO "authenticated";
GRANT ALL ON TABLE "public"."sessoes" TO "service_role";



GRANT ALL ON TABLE "public"."textos_base" TO "service_role";
GRANT SELECT ON TABLE "public"."textos_base" TO "anon";
GRANT SELECT ON TABLE "public"."textos_base" TO "authenticated";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "service_role";







