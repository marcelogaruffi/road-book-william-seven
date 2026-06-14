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
          hotel_checkout: string | null
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
          hotel_checkout?: string | null
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
          hotel_checkout?: string | null
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
