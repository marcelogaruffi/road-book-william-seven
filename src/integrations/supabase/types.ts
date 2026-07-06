export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
        relatorio_publico: {
          Row: {
            id: string
            roadbook_id: string
            data: string
            horario: string
            atividade: string
            publico_presente: number | null
            publico_majoritario: string[] | null
            created_at: string
          }
          Insert: {
            id?: string
            roadbook_id: string
            data: string
            horario: string
            atividade: string
            publico_presente?: number | null
            publico_majoritario?: string[] | null
            created_at?: string
          }
          Update: {
            id?: string
            roadbook_id?: string
            data?: string
            horario?: string
            atividade?: string
            publico_presente?: number | null
            publico_majoritario?: string[] | null
            created_at?: string
          }
          Relationships: [
            {
              foreignKeyName: "relatorio_publico_roadbook_id_fkey"
              columns: ["roadbook_id"]
              isOneToOne: false
              referencedRelation: "roadbooks"
              referencedColumns: ["id"]
            }
          ]
        }

        eventos: {
          Row: {
            cidade: string
            created_at: string
            created_by: string | null
            data: string
            equipe: Json | null
            espetaculo: string
            horario: string
            id: string
            local: string
          }
          Insert: {
            cidade: string
            created_at?: string
            created_by?: string | null
            data: string
            equipe?: Json | null
            espetaculo: string
            horario: string
            id?: string
            local: string
          }
          Update: {
            cidade?: string
            created_at?: string
            created_by?: string | null
            data?: string
            equipe?: Json | null
            espetaculo?: string
            horario?: string
            id?: string
            local?: string
          }
          Relationships: [
            {
              foreignKeyName: "eventos_created_by_fkey"
              columns: ["created_by"]
              isOneToOne: false
              referencedRelation: "users"
              referencedColumns: ["id"]
            }
          ]
        }
        financas_despesas: {
          Row: {
            created_at: string
            descricao: string
            id: string
            nota_fiscal_url: string | null
            roadbook_id: string | null
            status: string
            tipo: string
            valor: number
          }
          Insert: {
            created_at?: string
            descricao: string
            id?: string
            nota_fiscal_url?: string | null
            roadbook_id?: string | null
            status?: string
            tipo: string
            valor?: number
          }
          Update: {
            created_at?: string
            descricao?: string
            id?: string
            nota_fiscal_url?: string | null
            roadbook_id?: string | null
            status?: string
            tipo?: string
            valor?: number
          }
          Relationships: [
            {
              foreignKeyName: "financas_despesas_roadbook_id_fkey"
              columns: ["roadbook_id"]
              isOneToOne: false
              referencedRelation: "roadbooks"
              referencedColumns: ["id"]
            }
          ]
        }
        financas_receitas: {
          Row: {
            comprovante_url: string | null
            contratante: string
            created_at: string
            id: string
            roadbook_id: string | null
            status: string
            valor: number
          }
          Insert: {
            comprovante_url?: string | null
            contratante: string
            created_at?: string
            id?: string
            roadbook_id?: string | null
            status?: string
            valor?: number
          }
          Update: {
            comprovante_url?: string | null
            contratante?: string
            created_at?: string
            id?: string
            roadbook_id?: string | null
            status?: string
            valor?: number
          }
          Relationships: [
            {
              foreignKeyName: "financas_receitas_roadbook_id_fkey"
              columns: ["roadbook_id"]
              isOneToOne: false
              referencedRelation: "roadbooks"
              referencedColumns: ["id"]
            }
          ]
        }
        invites: {
          Row: {
            created_at: string
            created_by: string
            email: string | null
            id: string
            role: "dev" | "admin" | "produtor" | "iluminador" | "motorista" | "tecnico_som" | "artista" | "user"
            token: string
            used_at: string | null
            expires_at: string
          }
          Insert: {
            created_at?: string
            created_by: string
            email?: string | null
            id?: string
            role: "dev" | "admin" | "produtor" | "iluminador" | "motorista" | "tecnico_som" | "artista" | "user"
            token: string
            used_at?: string | null
          }
          Update: {
            created_at?: string
            created_by?: string
            email?: string | null
            id?: string
            role?: "dev" | "admin" | "produtor" | "iluminador" | "motorista" | "tecnico_som" | "artista" | "user"
            token?: string
            used_at?: string | null
          }
          Relationships: []
        }
        profiles: {
          Row: {
            created_at: string
            email: string | null
            foto_url: string | null
            id: string
            nome: string
            role: "dev" | "admin" | "produtor" | "iluminador" | "motorista" | "tecnico_som" | "artista" | "user"
            updated_at: string
          }
          Insert: {
            created_at?: string
            email?: string | null
            foto_url?: string | null
            id: string
            nome: string
            role?: "dev" | "admin" | "produtor" | "iluminador" | "motorista" | "tecnico_som" | "artista" | "user"
            updated_at?: string
          }
          Update: {
            created_at?: string
            email?: string | null
            foto_url?: string | null
            id?: string
            nome?: string
            role?: "dev" | "admin" | "produtor" | "iluminador" | "motorista" | "tecnico_som" | "artista" | "user"
            updated_at?: string
          }
          Relationships: []
        }

      roadbooks: {
        Row: {
          automacoes: Json
          cidade: string
          created_at: string
          data_final: string | null
          data_inicial: string | null
          documentos: Json
          espetaculo: string
          estado: string | null
          festival: string | null
          festival_info: Json
          hotel_checkin: string | null
          hotel_checkin_hora: string | null
          hotel_checkout: string | null
          hotel_checkout_hora: string | null
          hotel_endereco: string | null
          hotel_fotos: Json
          hotel_nome: string | null
          hotel_site: string | null
          hotel_telefone: string | null
          id: string
          ordem: number | null
          outros_contatos: Json
          producao_nome: string | null
          producao_telefone: string | null
          producao_whatsapp: string | null
          programacao: Json
          quartos: Json
          receptivo_nome: string | null
          receptivo_telefone: string | null
          receptivo_whatsapp: string | null
          resumo_executivo: string | null
          slug: string
          teatro_endereco: string | null
          teatro_fotos: Json
          teatro_nome: string | null
          teatro_observacoes: string | null
          teatro_site: string | null
          teatro_telefone: string | null
          tour_id: string | null
          updated_at: string
          user_id: string
          voo_ida: Json
          voo_volta: Json
        }
        Insert: {
          automacoes?: Json
          cidade: string
          created_at?: string
          data_final?: string | null
          data_inicial?: string | null
          documentos?: Json
          espetaculo: string
          estado?: string | null
          festival?: string | null
          festival_info?: Json
          hotel_checkin?: string | null
          hotel_checkin_hora?: string | null
          hotel_checkout?: string | null
          hotel_checkout_hora?: string | null
          hotel_endereco?: string | null
          hotel_fotos?: Json
          hotel_nome?: string | null
          hotel_site?: string | null
          hotel_telefone?: string | null
          id?: string
          ordem?: number | null
          outros_contatos?: Json
          producao_nome?: string | null
          producao_telefone?: string | null
          producao_whatsapp?: string | null
          programacao?: Json
          quartos?: Json
          receptivo_nome?: string | null
          receptivo_telefone?: string | null
          receptivo_whatsapp?: string | null
          resumo_executivo?: string | null
          slug: string
          teatro_endereco?: string | null
          teatro_fotos?: Json
          teatro_nome?: string | null
          teatro_observacoes?: string | null
          teatro_site?: string | null
          teatro_telefone?: string | null
          tour_id?: string | null
          updated_at?: string
          user_id: string
          voo_ida?: Json
          voo_volta?: Json
        }
        Update: {
          automacoes?: Json
          cidade?: string
          created_at?: string
          data_final?: string | null
          data_inicial?: string | null
          documentos?: Json
          espetaculo?: string
          estado?: string | null
          festival?: string | null
          festival_info?: Json
          hotel_checkin?: string | null
          hotel_checkin_hora?: string | null
          hotel_checkout?: string | null
          hotel_checkout_hora?: string | null
          hotel_endereco?: string | null
          hotel_fotos?: Json
          hotel_nome?: string | null
          hotel_site?: string | null
          hotel_telefone?: string | null
          id?: string
          ordem?: number | null
          outros_contatos?: Json
          producao_nome?: string | null
          producao_telefone?: string | null
          producao_whatsapp?: string | null
          programacao?: Json
          quartos?: Json
          receptivo_nome?: string | null
          receptivo_telefone?: string | null
          receptivo_whatsapp?: string | null
          resumo_executivo?: string | null
          slug?: string
          teatro_endereco?: string | null
          teatro_fotos?: Json
          teatro_nome?: string | null
          teatro_observacoes?: string | null
          teatro_site?: string | null
          teatro_telefone?: string | null
          tour_id?: string | null
          updated_at?: string
          user_id?: string
          voo_ida?: Json
          voo_volta?: Json
        }
        Relationships: [
          {
            foreignKeyName: "roadbooks_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tours: {
        Row: {
          created_at: string
          espetaculo: string | null
          id: string
          nome: string
          producao: string | null
          slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          espetaculo?: string | null
          id?: string
          nome: string
          producao?: string | null
          slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          espetaculo?: string | null
          id?: string
          nome?: string
          producao?: string | null
          slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
