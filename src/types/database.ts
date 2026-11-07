
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "bancas": {
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
                },"profiles": {
                  Row: {
                    "avatar_url": string | null,"cidade": string,"concurso_alvo": string | null,"created_at": string,"estado": string,"id": string,"nome": string,"plano": string,"pontuacao": number,"sobrenome": string,"streak_dias": number,"streak_ultima_data": string | null,"telefone": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_url"?: string | null,"cidade": string,"concurso_alvo"?: string | null,"created_at"?: string,"estado": string,"id": string,"nome": string,"plano"?: string,"pontuacao"?: number,"sobrenome": string,"streak_dias"?: number,"streak_ultima_data"?: string | null,"telefone"?: string | null
                  }
                  Update: {
                    "avatar_url"?: string | null,"cidade"?: string,"concurso_alvo"?: string | null,"created_at"?: string,"estado"?: string,"id"?: string,"nome"?: string,"plano"?: string,"pontuacao"?: number,"sobrenome"?: string,"streak_dias"?: number,"streak_ultima_data"?: string | null,"telefone"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"questoes": {
                  Row: {
                    "alternativas": NonNullable<Json>,"ano": number,"ativo": boolean,"banca_id": number,"cargo_id": number | null,"carreira_id": number | null,"codigo": string,"created_at": string,"enunciado": string,"estado_prova": string,"foco": Database["public"]['Enums']["foco_questao"],"gabarito": string,"id": string,"justificativa": string | null,"justificativa_alternativas": Json | null,"materia_id": number,"texto_base_id": string | null,"tipo": Database["public"]['Enums']["tipo_questao"]
                  }
                  ComputedFields: never
                  Insert: {
                    "alternativas": NonNullable<Json>,"ano": number,"ativo"?: boolean,"banca_id": number,"cargo_id"?: number | null,"carreira_id"?: number | null,"codigo": string,"created_at"?: string,"enunciado": string,"estado_prova": string,"foco": Database["public"]['Enums']["foco_questao"],"gabarito": string,"id"?: string,"justificativa"?: string | null,"justificativa_alternativas"?: Json | null,"materia_id": number,"texto_base_id"?: string | null,"tipo": Database["public"]['Enums']["tipo_questao"]
                  }
                  Update: {
                    "alternativas"?: NonNullable<Json>,"ano"?: number,"ativo"?: boolean,"banca_id"?: number,"cargo_id"?: number | null,"carreira_id"?: number | null,"codigo"?: string,"created_at"?: string,"enunciado"?: string,"estado_prova"?: string,"foco"?: Database["public"]['Enums']["foco_questao"],"gabarito"?: string,"id"?: string,"justificativa"?: string | null,"justificativa_alternativas"?: Json | null,"materia_id"?: number,"texto_base_id"?: string | null,"tipo"?: Database["public"]['Enums']["tipo_questao"]
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
                },"sessao_questoes": {
                  Row: {
                    "correta": boolean | null,"marcada_revisao": boolean,"ordem": number,"questao_id": string,"respondida_at": string | null,"resposta": string | null,"sessao_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "correta"?: boolean | null,"marcada_revisao"?: boolean,"ordem": number,"questao_id": string,"respondida_at"?: string | null,"resposta"?: string | null,"sessao_id": string
                  }
                  Update: {
                    "correta"?: boolean | null,"marcada_revisao"?: boolean,"ordem"?: number,"questao_id"?: string,"respondida_at"?: string | null,"resposta"?: string | null,"sessao_id"?: string
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
                    "acertos": number | null,"created_at": string,"filtros": NonNullable<Json>,"finished_at": string | null,"id": string,"modo": string,"started_at": string,"status": Database["public"]['Enums']["sessao_status"],"tempo_segundos": number | null,"total_questoes": number,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "acertos"?: number | null,"created_at"?: string,"filtros"?: NonNullable<Json>,"finished_at"?: string | null,"id"?: string,"modo"?: string,"started_at"?: string,"status"?: Database["public"]['Enums']["sessao_status"],"tempo_segundos"?: number | null,"total_questoes": number,"user_id": string
                  }
                  Update: {
                    "acertos"?: number | null,"created_at"?: string,"filtros"?: NonNullable<Json>,"finished_at"?: string | null,"id"?: string,"modo"?: string,"started_at"?: string,"status"?: Database["public"]['Enums']["sessao_status"],"tempo_segundos"?: number | null,"total_questoes"?: number,"user_id"?: string
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
            "carregar_sessao":
{ Args: { "p_sessao_id": string }; Returns: Json
                           },
"iniciar_sessao":
{ Args: { "p_banca_id"?: number,"p_materia_id"?: number,"p_total_questoes": number }; Returns: Json
                           },
"responder_questao":
{ Args: { "p_questao_id": string,"p_resposta": string,"p_sessao_id": string }; Returns: Json
                           }
          }
          Enums: {
            "foco_questao": "concurso"|"vestibular"|"oab","sessao_status": "em_andamento"|"finalizado"|"abandonado","tipo_questao": "multipla_escolha"|"certo_errado"
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
  "public": {
          Enums: {
            "foco_questao": ["concurso", "vestibular", "oab"],"sessao_status": ["em_andamento", "finalizado", "abandonado"],"tipo_questao": ["multipla_escolha", "certo_errado"]
          }
        }
} as const
