
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {

  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "assinaturas": {
                  Row: {
                    "ativado_por": string | null,"atualizado_em": string,"cancelar_no_fim": boolean,"id": string,"inicio": string,"origem": string,"periodo_fim": string | null,"plano": string,"status": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ativado_por"?: string | null,"atualizado_em"?: string,"cancelar_no_fim"?: boolean,"id"?: string,"inicio"?: string,"origem": string,"periodo_fim"?: string | null,"plano": string,"status": string,"user_id": string
                  }
                  Update: {
                    "ativado_por"?: string | null,"atualizado_em"?: string,"cancelar_no_fim"?: boolean,"id"?: string,"inicio"?: string,"origem"?: string,"periodo_fim"?: string | null,"plano"?: string,"status"?: string,"user_id"?: string
                  }
                  Relationships: [

                  ]
                },"bancas": {
                  Row: {
                    "id": number,"nome": string,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: never,"nome": string,"slug": string
                  }
                  Update: {
                    "id"?: never,"nome"?: string,"slug"?: string
                  }
                  Relationships: [

                  ]
                },"cargos": {
                  Row: {
                    "id": number,"nome": string,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: never,"nome": string,"slug": string
                  }
                  Update: {
                    "id"?: never,"nome"?: string,"slug"?: string
                  }
                  Relationships: [

                  ]
                },"carreiras": {
                  Row: {
                    "id": number,"nome": string,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: never,"nome": string,"slug": string
                  }
                  Update: {
                    "id"?: never,"nome"?: string,"slug"?: string
                  }
                  Relationships: [

                  ]
                },"materias": {
                  Row: {
                    "id": number,"nome": string,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: never,"nome": string,"slug": string
                  }
                  Update: {
                    "id"?: never,"nome"?: string,"slug"?: string
                  }
                  Relationships: [

                  ]
                },"planos_config": {
                  Row: {
                    "plano": string,"ranking_visivel": boolean,"tamanhos_permitidos": (number)[]
                  }
                  ComputedFields: never
                  Insert: {
                    "plano": string,"ranking_visivel": boolean,"tamanhos_permitidos": (number)[]
                  }
                  Update: {
                    "plano"?: string,"ranking_visivel"?: boolean,"tamanhos_permitidos"?: (number)[]
                  }
                  Relationships: [

                  ]
                },"profiles": {
                  Row: {
                    "avatar_url": string | null,"cidade": string,"concurso_alvo": string | null,"created_at": string,"estado": string,"id": string,"municipio_ibge": string | null,"nickname": string | null,"nome": string,"plano": string,"pontuacao": number,"ranking_opt_in": boolean,"sobrenome": string,"streak_dias": number,"streak_ultima_data": string | null,"telefone": string | null,"uf": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_url"?: string | null,"cidade": string,"concurso_alvo"?: string | null,"created_at"?: string,"estado": string,"id": string,"municipio_ibge"?: string | null,"nickname"?: string | null,"nome": string,"plano"?: string,"pontuacao"?: number,"ranking_opt_in"?: boolean,"sobrenome": string,"streak_dias"?: number,"streak_ultima_data"?: string | null,"telefone"?: string | null,"uf"?: string | null
                  }
                  Update: {
                    "avatar_url"?: string | null,"cidade"?: string,"concurso_alvo"?: string | null,"created_at"?: string,"estado"?: string,"id"?: string,"municipio_ibge"?: string | null,"nickname"?: string | null,"nome"?: string,"plano"?: string,"pontuacao"?: number,"ranking_opt_in"?: boolean,"sobrenome"?: string,"streak_dias"?: number,"streak_ultima_data"?: string | null,"telefone"?: string | null,"uf"?: string | null
                  }
                  Relationships: [

                  ]
                },"questoes": {
                  Row: {
                    "alternativas": NonNullable<Json>,"ano": number,"ativo": boolean,"banca_id": number,"cargo_id": number | null,"carreira_id": number | null,"codigo": string,"created_at": string,"enunciado": string,"estado_prova": string,"foco": Database["public"]['Enums']["foco_questao"],"gabarito": string | null,"id": string,"justificativa": string | null,"justificativa_alternativas": Json | null,"materia_id": number,"peso_dificuldade": number,"status_gabarito": Database["public"]['Enums']["status_gabarito"],"t_ref_segundos": number,"texto_base_id": string | null,"tipo": Database["public"]['Enums']["tipo_questao"]
                  }
                  ComputedFields: never
                  Insert: {
                    "alternativas": NonNullable<Json>,"ano": number,"ativo"?: boolean,"banca_id": number,"cargo_id"?: number | null,"carreira_id"?: number | null,"codigo": string,"created_at"?: string,"enunciado": string,"estado_prova": string,"foco": Database["public"]['Enums']["foco_questao"],"gabarito"?: string | null,"id"?: string,"justificativa"?: string | null,"justificativa_alternativas"?: Json | null,"materia_id": number,"peso_dificuldade"?: number,"status_gabarito"?: Database["public"]['Enums']["status_gabarito"],"t_ref_segundos"?: number,"texto_base_id"?: string | null,"tipo": Database["public"]['Enums']["tipo_questao"]
                  }
                  Update: {
                    "alternativas"?: NonNullable<Json>,"ano"?: number,"ativo"?: boolean,"banca_id"?: number,"cargo_id"?: number | null,"carreira_id"?: number | null,"codigo"?: string,"created_at"?: string,"enunciado"?: string,"estado_prova"?: string,"foco"?: Database["public"]['Enums']["foco_questao"],"gabarito"?: string | null,"id"?: string,"justificativa"?: string | null,"justificativa_alternativas"?: Json | null,"materia_id"?: number,"peso_dificuldade"?: number,"status_gabarito"?: Database["public"]['Enums']["status_gabarito"],"t_ref_segundos"?: number,"texto_base_id"?: string | null,"tipo"?: Database["public"]['Enums']["tipo_questao"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "questoes_banca_id_fkey"
      columns: ["banca_id"]
isOneToOne: false
      referencedRelation: "bancas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "questoes_cargo_id_fkey"
      columns: ["cargo_id"]
isOneToOne: false
      referencedRelation: "cargos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "questoes_carreira_id_fkey"
      columns: ["carreira_id"]
isOneToOne: false
      referencedRelation: "carreiras"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "questoes_materia_id_fkey"
      columns: ["materia_id"]
isOneToOne: false
      referencedRelation: "materias"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "questoes_texto_base_id_fkey"
      columns: ["texto_base_id"]
isOneToOne: false
      referencedRelation: "textos_base"
      referencedColumns: ["id"]
    }
                  ]
                },"questoes_pontuadas": {
                  Row: {
                    "pontuada_em": string,"primeira_sessao_id": string,"questao_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "pontuada_em"?: string,"primeira_sessao_id": string,"questao_id": string,"user_id": string
                  }
                  Update: {
                    "pontuada_em"?: string,"primeira_sessao_id"?: string,"questao_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "questoes_pontuadas_primeira_sessao_id_fkey"
      columns: ["primeira_sessao_id"]
isOneToOne: false
      referencedRelation: "sessoes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "questoes_pontuadas_questao_id_fkey"
      columns: ["questao_id"]
isOneToOne: false
      referencedRelation: "questoes"
      referencedColumns: ["id"]
    }
                  ]
                },"ranking_pontos": {
                  Row: {
                    "atualizado_em": string,"municipio_ibge": string | null,"periodo_inicio": string,"periodo_tipo": string,"pontos": number,"uf": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "atualizado_em"?: string,"municipio_ibge"?: string | null,"periodo_inicio": string,"periodo_tipo": string,"pontos"?: number,"uf"?: string | null,"user_id": string
                  }
                  Update: {
                    "atualizado_em"?: string,"municipio_ibge"?: string | null,"periodo_inicio"?: string,"periodo_tipo"?: string,"pontos"?: number,"uf"?: string | null,"user_id"?: string
                  }
                  Relationships: [

                  ]
                },"sessao_questoes": {
                  Row: {
                    "bonus_tempo": number,"correta": boolean | null,"exibida_em": string | null,"formula_versao": number,"marcada_revisao": boolean,"mult_sequencia": number,"ordem": number,"pontos": number,"pontos_base": number,"pontua_ranking": boolean,"questao_id": string,"respondida_at": string | null,"respondida_em": string | null,"resposta": string | null,"sequencia": number,"sessao_id": string,"tempo_ativo_segundos": number,"tempo_servidor_ms": number | null,"tempo_valido": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "bonus_tempo"?: number,"correta"?: boolean | null,"exibida_em"?: string | null,"formula_versao"?: number,"marcada_revisao"?: boolean,"mult_sequencia"?: number,"ordem": number,"pontos"?: number,"pontos_base"?: number,"pontua_ranking"?: boolean,"questao_id": string,"respondida_at"?: string | null,"respondida_em"?: string | null,"resposta"?: string | null,"sequencia"?: number,"sessao_id": string,"tempo_ativo_segundos"?: number,"tempo_servidor_ms"?: number | null,"tempo_valido"?: boolean
                  }
                  Update: {
                    "bonus_tempo"?: number,"correta"?: boolean | null,"exibida_em"?: string | null,"formula_versao"?: number,"marcada_revisao"?: boolean,"mult_sequencia"?: number,"ordem"?: number,"pontos"?: number,"pontos_base"?: number,"pontua_ranking"?: boolean,"questao_id"?: string,"respondida_at"?: string | null,"respondida_em"?: string | null,"resposta"?: string | null,"sequencia"?: number,"sessao_id"?: string,"tempo_ativo_segundos"?: number,"tempo_servidor_ms"?: number | null,"tempo_valido"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "sessao_questoes_questao_id_fkey"
      columns: ["questao_id"]
isOneToOne: false
      referencedRelation: "questoes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "sessao_questoes_sessao_id_fkey"
      columns: ["sessao_id"]
isOneToOne: false
      referencedRelation: "sessoes"
      referencedColumns: ["id"]
    }
                  ]
                },"sessoes": {
                  Row: {
                    "acertos": number | null,"created_at": string,"filtros": NonNullable<Json>,"finalizada_em": string | null,"finished_at": string | null,"id": string,"modo": string,"pontos_total": number,"started_at": string,"status": Database["public"]['Enums']["sessao_status"],"tempo_ativo_segundos": number,"tempo_segundos": number | null,"total_questoes": number,"ultima_atividade_em": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "acertos"?: number | null,"created_at"?: string,"filtros"?: NonNullable<Json>,"finalizada_em"?: string | null,"finished_at"?: string | null,"id"?: string,"modo"?: string,"pontos_total"?: number,"started_at"?: string,"status"?: Database["public"]['Enums']["sessao_status"],"tempo_ativo_segundos"?: number,"tempo_segundos"?: number | null,"total_questoes": number,"ultima_atividade_em"?: string,"user_id": string
                  }
                  Update: {
                    "acertos"?: number | null,"created_at"?: string,"filtros"?: NonNullable<Json>,"finalizada_em"?: string | null,"finished_at"?: string | null,"id"?: string,"modo"?: string,"pontos_total"?: number,"started_at"?: string,"status"?: Database["public"]['Enums']["sessao_status"],"tempo_ativo_segundos"?: number,"tempo_segundos"?: number | null,"total_questoes"?: number,"ultima_atividade_em"?: string,"user_id"?: string
                  }
                  Relationships: [

                  ]
                },"textos_base": {
                  Row: {
                    "conteudo": string,"created_at": string,"fonte": string | null,"hash": string,"id": string,"titulo": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "conteudo": string,"created_at"?: string,"fonte"?: string | null,"hash": string,"id"?: string,"titulo"?: string | null
                  }
                  Update: {
                    "conteudo"?: string,"created_at"?: string,"fonte"?: string | null,"hash"?: string,"id"?: string,"titulo"?: string | null
                  }
                  Relationships: [

                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "abandonar_sessoes_inativas":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"calcular_pontos":
{ Args: { "p_acertou": boolean,"p_formula_versao"?: number,"p_peso_dificuldade": number,"p_sequencia": number,"p_t_ref_segundos": number,"p_tempo_ms": number }; Returns: {
              "bonus_tempo": number,"mult_sequencia": number,"pontos": number,"pontos_base": number
            }[]
                           },
"carregar_sessao":
{ Args: { "p_sessao_id": string }; Returns: Json
                           },
"finalizar_sessao":
{ Args: { "p_sessao_id": string }; Returns: Json
                           },
"iniciar_sessao":
{ Args: { "p_banca_ids"?: (number)[],"p_materia_ids"?: (number)[],"p_total_questoes": number }; Returns: Json
                           },
"obter_estatisticas":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"obter_minha_posicao":
{ Args: { "p_escopo": string,"p_periodo": string }; Returns: Json
                           },
"obter_ranking":
{ Args: { "p_escopo": string,"p_periodo": string }; Returns: Json
                           },
"obter_resultado":
{ Args: { "p_sessao_id": string }; Returns: Json
                           },
"obter_sessao_em_andamento":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"plano_atual_usuario":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"registrar_assinatura_pix_manual":
{ Args: { "p_ativado_por": string,"p_periodo_dias": number,"p_user_id": string }; Returns: string
                           },
"registrar_tempo_ativo":
{ Args: { "p_sessao_id": string,"p_tempo_ativo_segundos": number }; Returns: number
                           },
"responder_questao":
{ Args: { "p_questao_id": string,"p_resposta": string,"p_sessao_id": string,"p_tempo_ativo_segundos": number }; Returns: Json
                           }
          }
          Enums: {
            "foco_questao": "concurso"|"vestibular"|"oab","sessao_status": "em_andamento"|"finalizado"|"abandonado","status_gabarito": "nao_verificado"|"preliminar"|"definitivo"|"anulada"|"pendente","tipo_questao": "multipla_escolha"|"certo_errado"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {

          }
        },"public": {
          Enums: {
            "foco_questao": ["concurso", "vestibular", "oab"],"sessao_status": ["em_andamento", "finalizado", "abandonado"],"status_gabarito": ["nao_verificado", "preliminar", "definitivo", "anulada", "pendente"],"tipo_questao": ["multipla_escolha", "certo_errado"]
          }
        }
} as const
