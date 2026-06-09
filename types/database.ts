export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          nome: string
          sobrenome: string
          cidade: string
          estado: string
          telefone: string | null
          concurso_alvo: string | null
          avatar_url: string | null
          plano: 'gratuito' | 'premium'
          pontuacao: number
          streak_dias: number
          streak_ultima_data: string | null
          created_at: string
        }
        Insert: {
          id: string
          nome: string
          sobrenome: string
          cidade: string
          estado: string
          telefone?: string | null
          concurso_alvo?: string | null
          avatar_url?: string | null
          plano?: 'gratuito' | 'premium'
          pontuacao?: number
          streak_dias?: number
          streak_ultima_data?: string | null
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      logs_acesso: {
        Row: {
          id: number
          user_id: string | null
          acao: string
          ip_origem: string | null
          created_at: string
        }
        Insert: {
          user_id?: string | null
          acao: string
          ip_origem?: string | null
        }
        Update: never
      }
    }
  }
}

// Helpers de tipo
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
