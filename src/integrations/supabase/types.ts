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
      admin_auditoria: {
        Row: {
          acao: string
          admin_id: string
          caminho: string
          created_at: string
          detalhe: string
          id: string
          user_id: string | null
        }
        Insert: {
          acao: string
          admin_id: string
          caminho?: string
          created_at?: string
          detalhe?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          acao?: string
          admin_id?: string
          caminho?: string
          created_at?: string
          detalhe?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      alertas_plantao: {
        Row: {
          contrato_id: string
          created_at: string
          criado_por: string
          id: string
          lido_em: string | null
          mensagem: string
        }
        Insert: {
          contrato_id: string
          created_at?: string
          criado_por: string
          id?: string
          lido_em?: string | null
          mensagem: string
        }
        Update: {
          contrato_id?: string
          created_at?: string
          criado_por?: string
          id?: string
          lido_em?: string | null
          mensagem?: string
        }
        Relationships: [
          {
            foreignKeyName: "alertas_plantao_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos: {
        Row: {
          assistido_nome: string
          checkout_url: string | null
          created_at: string
          criado_por: string
          cuidadora_aceite_em: string | null
          cuidadora_aceite_nome: string
          cuidadora_cidade: string
          cuidadora_cpf: string
          cuidadora_id: string
          cuidadora_nome: string
          cuidadora_telefone: string
          cuidadora_verificada: boolean
          data_fim: string | null
          data_inicio: string
          descricao_cuidado: string
          emitido_em: string
          endereco: string
          familia_aceite_em: string | null
          familia_aceite_nome: string
          familia_bairro: string
          familia_cidade: string
          familia_cpf: string
          familia_id: string
          familia_nome: string
          familia_telefone: string
          familia_verificada: boolean
          hora_fim: string
          hora_inicio: string
          id: string
          motivo_recusa: string
          observacoes: string
          pagamento_id: string | null
          pagamento_status: string
          pago_em: string | null
          recusado_por: string | null
          regime: string
          reserva_id: string
          status: string
          taxa_percentual: number
          termo_texto: string
          updated_at: string
          valor: number
        }
        Insert: {
          assistido_nome?: string
          checkout_url?: string | null
          created_at?: string
          criado_por: string
          cuidadora_aceite_em?: string | null
          cuidadora_aceite_nome?: string
          cuidadora_cidade?: string
          cuidadora_cpf?: string
          cuidadora_id: string
          cuidadora_nome?: string
          cuidadora_telefone?: string
          cuidadora_verificada?: boolean
          data_fim?: string | null
          data_inicio: string
          descricao_cuidado?: string
          emitido_em?: string
          endereco?: string
          familia_aceite_em?: string | null
          familia_aceite_nome?: string
          familia_bairro?: string
          familia_cidade?: string
          familia_cpf?: string
          familia_id: string
          familia_nome?: string
          familia_telefone?: string
          familia_verificada?: boolean
          hora_fim?: string
          hora_inicio?: string
          id?: string
          motivo_recusa?: string
          observacoes?: string
          pagamento_id?: string | null
          pagamento_status?: string
          pago_em?: string | null
          recusado_por?: string | null
          regime?: string
          reserva_id?: string
          status?: string
          taxa_percentual?: number
          termo_texto?: string
          updated_at?: string
          valor?: number
        }
        Update: {
          assistido_nome?: string
          checkout_url?: string | null
          created_at?: string
          criado_por?: string
          cuidadora_aceite_em?: string | null
          cuidadora_aceite_nome?: string
          cuidadora_cidade?: string
          cuidadora_cpf?: string
          cuidadora_id?: string
          cuidadora_nome?: string
          cuidadora_telefone?: string
          cuidadora_verificada?: boolean
          data_fim?: string | null
          data_inicio?: string
          descricao_cuidado?: string
          emitido_em?: string
          endereco?: string
          familia_aceite_em?: string | null
          familia_aceite_nome?: string
          familia_bairro?: string
          familia_cidade?: string
          familia_cpf?: string
          familia_id?: string
          familia_nome?: string
          familia_telefone?: string
          familia_verificada?: boolean
          hora_fim?: string
          hora_inicio?: string
          id?: string
          motivo_recusa?: string
          observacoes?: string
          pagamento_id?: string | null
          pagamento_status?: string
          pago_em?: string | null
          recusado_por?: string | null
          regime?: string
          reserva_id?: string
          status?: string
          taxa_percentual?: number
          termo_texto?: string
          updated_at?: string
          valor?: number
        }
        Relationships: []
      }
      conversas: {
        Row: {
          assunto: string
          created_at: string
          cuidadora_id: string
          familia_id: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          assunto?: string
          created_at?: string
          cuidadora_id: string
          familia_id: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          assunto?: string
          created_at?: string
          cuidadora_id?: string
          familia_id?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      documentos: {
        Row: {
          caminho: string
          created_at: string
          id: string
          mime: string
          nome_arquivo: string
          origem: string
          tamanho: number
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          caminho: string
          created_at?: string
          id?: string
          mime?: string
          nome_arquivo?: string
          origem?: string
          tamanho?: number
          tipo?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          caminho?: string
          created_at?: string
          id?: string
          mime?: string
          nome_arquivo?: string
          origem?: string
          tamanho?: number
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mensagens: {
        Row: {
          conversa_id: string
          created_at: string
          id: string
          mensagem: string
          remetente_id: string
        }
        Insert: {
          conversa_id: string
          created_at?: string
          id?: string
          mensagem: string
          remetente_id: string
        }
        Update: {
          conversa_id?: string
          created_at?: string
          id?: string
          mensagem?: string
          remetente_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "conversas"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens_conversa: {
        Row: {
          created_at: string
          cuidadora_id: string
          familia_id: string
          id: string
          mensagem: string
          remetente_id: string
        }
        Insert: {
          created_at?: string
          cuidadora_id: string
          familia_id: string
          id?: string
          mensagem: string
          remetente_id: string
        }
        Update: {
          created_at?: string
          cuidadora_id?: string
          familia_id?: string
          id?: string
          mensagem?: string
          remetente_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bairros: string[]
          bio: string
          cidade: string
          created_at: string
          especialidades: string[]
          id: string
          nome: string
          tarifa_diaria: number
          tarifa_hora: number
          tarifa_plantao12: number
          tarifa_plantao24: number
          tipo: string
          updated_at: string
          verificado: boolean
        }
        Insert: {
          bairros?: string[]
          bio?: string
          cidade?: string
          created_at?: string
          especialidades?: string[]
          id: string
          nome?: string
          tarifa_diaria?: number
          tarifa_hora?: number
          tarifa_plantao12?: number
          tarifa_plantao24?: number
          tipo?: string
          updated_at?: string
          verificado?: boolean
        }
        Update: {
          bairros?: string[]
          bio?: string
          cidade?: string
          created_at?: string
          especialidades?: string[]
          id?: string
          nome?: string
          tarifa_diaria?: number
          tarifa_hora?: number
          tarifa_plantao12?: number
          tarifa_plantao24?: number
          tipo?: string
          updated_at?: string
          verificado?: boolean
        }
        Relationships: []
      }
      propostas: {
        Row: {
          created_at: string
          cuidadora_id: string
          data_servico: string
          expira_em: string
          familia_id: string
          hora_fim: string
          hora_inicio: string
          id: string
          observacao: string
          status: string
          updated_at: string
          valor_proposto: number
        }
        Insert: {
          created_at?: string
          cuidadora_id: string
          data_servico: string
          expira_em?: string
          familia_id: string
          hora_fim: string
          hora_inicio: string
          id?: string
          observacao?: string
          status?: string
          updated_at?: string
          valor_proposto: number
        }
        Update: {
          created_at?: string
          cuidadora_id?: string
          data_servico?: string
          expira_em?: string
          familia_id?: string
          hora_fim?: string
          hora_inicio?: string
          id?: string
          observacao?: string
          status?: string
          updated_at?: string
          valor_proposto?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verificacoes: {
        Row: {
          antecedentes_dados: Json | null
          antecedentes_status: string
          cpf: string
          cpf_valido: boolean
          created_at: string
          data_nascimento: string
          documento_path: string
          face_confere: boolean
          id: string
          nome_documento: string
          observacoes: string
          revisao_manual: boolean
          score: number
          selfie_path: string
          status: string
          tipo_documento: string
          updated_at: string
          user_id: string
        }
        Insert: {
          antecedentes_dados?: Json | null
          antecedentes_status?: string
          cpf?: string
          cpf_valido?: boolean
          created_at?: string
          data_nascimento?: string
          documento_path?: string
          face_confere?: boolean
          id?: string
          nome_documento?: string
          observacoes?: string
          revisao_manual?: boolean
          score?: number
          selfie_path?: string
          status?: string
          tipo_documento?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          antecedentes_dados?: Json | null
          antecedentes_status?: string
          cpf?: string
          cpf_valido?: boolean
          created_at?: string
          data_nascimento?: string
          documento_path?: string
          face_confere?: boolean
          id?: string
          nome_documento?: string
          observacoes?: string
          revisao_manual?: boolean
          score?: number
          selfie_path?: string
          status?: string
          tipo_documento?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
