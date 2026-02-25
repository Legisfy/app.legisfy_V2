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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      assessores: {
        Row: {
          cargo: string | null
          created_at: string
          email: string | null
          gabinete_id: string
          id: string
          nome: string
          status: string | null
          telefone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cargo?: string | null
          created_at?: string
          email?: string | null
          gabinete_id: string
          id?: string
          nome: string
          status?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cargo?: string | null
          created_at?: string
          email?: string | null
          gabinete_id?: string
          id?: string
          nome?: string
          status?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessores_gabinete_id_fkey"
            columns: ["gabinete_id"]
            isOneToOne: false
            referencedRelation: "gabinetes"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          acao: string
          created_at: string | null
          gabinete_id: string | null
          id: string
          metadata: Json | null
          registro_id: string
          status_anterior: string | null
          status_novo: string | null
          tabela: string
          user_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string | null
          gabinete_id?: string | null
          id?: string
          metadata?: Json | null
          registro_id: string
          status_anterior?: string | null
          status_novo?: string | null
          tabela: string
          user_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string | null
          gabinete_id?: string | null
          id?: string
          metadata?: Json | null
          registro_id?: string
          status_anterior?: string | null
          status_novo?: string | null
          tabela?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_gabinete_id_fkey"
            columns: ["gabinete_id"]
            isOneToOne: false
            referencedRelation: "gabinetes"
            referencedColumns: ["id"]
          },
        ]
      }
      camaras: {
        Row: {
          cidade_id: string
          created_at: string
          id: string
          nome: string
          tipo: Database["public"]["Enums"]["camara_tipo"]
          updated_at: string
        }
        Insert: {
          cidade_id: string
          created_at?: string
          id?: string
          nome: string
          tipo: Database["public"]["Enums"]["camara_tipo"]
          updated_at?: string
        }
        Update: {
          cidade_id?: string
          created_at?: string
          id?: string
          nome?: string
          tipo?: Database["public"]["Enums"]["camara_tipo"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "camaras_cidade_id_fkey"
            columns: ["cidade_id"]
            isOneToOne: false
            referencedRelation: "cidades"
            referencedColumns: ["id"]
          },
        ]
      }
      cidades: {
        Row: {
          created_at: string
          estado_id: string
          ibge_code: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          estado_id: string
          ibge_code?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          estado_id?: string
          ibge_code?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cidades_estado_id_fkey"
            columns: ["estado_id"]
            isOneToOne: false
            referencedRelation: "estados"
            referencedColumns: ["id"]
          },
        ]
      }
      demandas: {
        Row: {
          created_at: string
          descricao: string | null
          eleitor_id: string | null
          gabinete_id: string
          id: string
          prioridade: string | null
          resolvido_em: string | null
          status: string
          tempo_resposta_segundos: number | null
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          eleitor_id?: string | null
          gabinete_id: string
          id?: string
          prioridade?: string | null
          resolvido_em?: string | null
          status?: string
          tempo_resposta_segundos?: number | null
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          eleitor_id?: string | null
          gabinete_id?: string
          id?: string
          prioridade?: string | null
          resolvido_em?: string | null
          status?: string
          tempo_resposta_segundos?: number | null
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demandas_eleitor_id_fkey"
            columns: ["eleitor_id"]
            isOneToOne: false
            referencedRelation: "eleitores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandas_gabinete_id_fkey"
            columns: ["gabinete_id"]
            isOneToOne: false
            referencedRelation: "gabinetes"
            referencedColumns: ["id"]
          },
        ]
      }
      eleitores: {
        Row: {
          address: string | null
          birth_date: string | null
          cep: string | null
          cidade: string | null
          created_at: string
          email: string | null
          gabinete_id: string
          id: string
          is_leader: boolean | null
          leader_subtype: string | null
          leader_type: string | null
          name: string
          neighborhood: string | null
          profession: string | null
          profile_photo_url: string | null
          sex: string | null
          social_media: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          cep?: string | null
          cidade?: string | null
          created_at?: string
          email?: string | null
          gabinete_id: string
          id?: string
          is_leader?: boolean | null
          leader_subtype?: string | null
          leader_type?: string | null
          name: string
          neighborhood?: string | null
          profession?: string | null
          profile_photo_url?: string | null
          sex?: string | null
          social_media?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          cep?: string | null
          cidade?: string | null
          created_at?: string
          email?: string | null
          gabinete_id?: string
          id?: string
          is_leader?: boolean | null
          leader_subtype?: string | null
          leader_type?: string | null
          name?: string
          neighborhood?: string | null
          profession?: string | null
          profile_photo_url?: string | null
          sex?: string | null
          social_media?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eleitores_gabinete_id_fkey"
            columns: ["gabinete_id"]
            isOneToOne: false
            referencedRelation: "gabinetes"
            referencedColumns: ["id"]
          },
        ]
      }
      publicos: {
        Row: {
          id: string
          gabinete_id: string | null
          created_by: string | null
          nome: string
          descricao: string | null
          cor: string | null
          filtros: Json | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          gabinete_id?: string | null
          created_by?: string | null
          nome: string
          descricao?: string | null
          cor?: string | null
          filtros?: Json | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          gabinete_id?: string | null
          created_by?: string | null
          nome?: string
          descricao?: string | null
          cor?: string | null
          filtros?: Json | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "publicos_gabinete_id_fkey"
            columns: ["gabinete_id"]
            isOneToOne: false
            referencedRelation: "gabinetes"
            referencedColumns: ["id"]
          }
        ]
      }
      gabinete_custom_tags: {
        Row: {
          id: string
          gabinete_id: string | null
          name: string
          category: string
          subcategory: string | null
          color: string | null
          icon: string | null
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          gabinete_id?: string | null
          name: string
          category: string
          subcategory?: string | null
          color?: string | null
          icon?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          gabinete_id?: string | null
          name?: string
          category?: string
          subcategory?: string | null
          color?: string | null
          icon?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gabinete_custom_tags_gabinete_id_fkey"
            columns: ["gabinete_id"]
            isOneToOne: false
            referencedRelation: "gabinetes"
            referencedColumns: ["id"]
          }
        ]
      }
      eleitor_tags: {
        Row: {
          id: string
          gabinete_id: string | null
          name: string
          color: string | null
          icon: string | null
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          gabinete_id?: string | null
          name: string
          color?: string | null
          icon?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          gabinete_id?: string | null
          name?: string
          color?: string | null
          icon?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eleitor_tags_gabinete_id_fkey"
            columns: ["gabinete_id"]
            isOneToOne: false
            referencedRelation: "gabinetes"
            referencedColumns: ["id"]
          }
        ]
      }
      estados: {
        Row: {
          created_at: string
          id: string
          nome: string
          sigla: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          sigla: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          sigla?: string
          updated_at?: string
        }
        Relationships: []
      }
      eventos: {
        Row: {
          cor: string | null
          created_at: string
          data_fim: string
          data_inicio: string
          descricao: string | null
          gabinete_id: string
          id: string
          local: string | null
          tipo: string | null
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cor?: string | null
          created_at?: string
          data_fim: string
          data_inicio: string
          descricao?: string | null
          gabinete_id: string
          id?: string
          local?: string | null
          tipo?: string | null
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cor?: string | null
          created_at?: string
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          gabinete_id?: string
          id?: string
          local?: string | null
          tipo?: string | null
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_gabinete_id_fkey"
            columns: ["gabinete_id"]
            isOneToOne: false
            referencedRelation: "gabinetes"
            referencedColumns: ["id"]
          },
        ]
      }
      gabinete_usuarios: {
        Row: {
          ativo: boolean
          created_at: string
          gabinete_id: string
          id: string
          permissions: Json | null
          role: Database["public"]["Enums"]["user_role_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          gabinete_id: string
          id?: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["user_role_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          gabinete_id?: string
          id?: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["user_role_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gabinete_usuarios_gabinete_id_fkey"
            columns: ["gabinete_id"]
            isOneToOne: false
            referencedRelation: "gabinetes"
            referencedColumns: ["id"]
          },
        ]
      }
      gabinetes: {
        Row: {
          camara_id: string
          chefe_id: string | null
          created_at: string
          descricao: string | null
          id: string
          logomarca_url: string | null
          nome: string
          partido_id: string | null
          politician_name: string | null
          politico_id: string
          status: Database["public"]["Enums"]["gabinete_status"]
          updated_at: string
        }
        Insert: {
          camara_id: string
          chefe_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          logomarca_url?: string | null
          nome: string
          partido_id?: string | null
          politician_name?: string | null
          politico_id: string
          status?: Database["public"]["Enums"]["gabinete_status"]
          updated_at?: string
        }
        Update: {
          camara_id?: string
          chefe_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          logomarca_url?: string | null
          nome?: string
          partido_id?: string | null
          politician_name?: string | null
          politico_id?: string
          status?: Database["public"]["Enums"]["gabinete_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gabinetes_camara_id_fkey"
            columns: ["camara_id"]
            isOneToOne: false
            referencedRelation: "camaras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gabinetes_partido_id_fkey"
            columns: ["partido_id"]
            isOneToOne: false
            referencedRelation: "partidos_politicos"
            referencedColumns: ["id"]
          },
        ]
      }
      ia_conversations: {
        Row: {
          created_at: string
          gabinete_id: string | null
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          gabinete_id?: string | null
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          gabinete_id?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ia_conversations_gabinete_id_fkey"
            columns: ["gabinete_id"]
            isOneToOne: false
            referencedRelation: "gabinetes"
            referencedColumns: ["id"]
          },
        ]
      }
      ia_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ia_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ia_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ideias: {
        Row: {
          created_at: string
          descricao: string | null
          gabinete_id: string
          id: string
          prioridade: string | null
          status: string | null
          tags: string[] | null
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          gabinete_id: string
          id?: string
          prioridade?: string | null
          status?: string | null
          tags?: string[] | null
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          gabinete_id?: string
          id?: string
          prioridade?: string | null
          status?: string | null
          tags?: string[] | null
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ideias_gabinete_id_fkey"
            columns: ["gabinete_id"]
            isOneToOne: false
            referencedRelation: "gabinetes"
            referencedColumns: ["id"]
          },
        ]
      }
      indicacao_status_events: {
        Row: {
          created_at: string
          id: string
          indicacao_id: string
          notes: string | null
          pdf_url: string | null
          protocolo: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          indicacao_id: string
          notes?: string | null
          pdf_url?: string | null
          protocolo?: string | null
          status: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          indicacao_id?: string
          notes?: string | null
          pdf_url?: string | null
          protocolo?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "indicacao_status_events_indicacao_id_fkey"
            columns: ["indicacao_id"]
            isOneToOne: false
            referencedRelation: "indicacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      indicacoes: {
        Row: {
          category: string | null
          created_at: string
          eleitor_id: string | null
          endereco_bairro: string | null
          endereco_cep: string | null
          endereco_rua: string | null
          fotos_urls: string[] | null
          gabinete_id: string
          id: string
          justificativa: string | null
          latitude: number | null
          longitude: number | null
          observacoes: string | null
          prioridade: string | null
          status: string
          tag: string | null
          tipo: string | null
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          eleitor_id?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_rua?: string | null
          fotos_urls?: string[] | null
          gabinete_id: string
          id?: string
          justificativa?: string | null
          latitude?: number | null
          longitude?: number | null
          observacoes?: string | null
          prioridade?: string | null
          status?: string
          tag?: string | null
          tipo?: string | null
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          eleitor_id?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_rua?: string | null
          fotos_urls?: string[] | null
          gabinete_id?: string
          id?: string
          justificativa?: string | null
          latitude?: number | null
          longitude?: number | null
          observacoes?: string | null
          prioridade?: string | null
          status?: string
          tag?: string | null
          tipo?: string | null
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "indicacoes_eleitor_id_fkey"
            columns: ["eleitor_id"]
            isOneToOne: false
            referencedRelation: "eleitores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicacoes_gabinete_id_fkey"
            columns: ["gabinete_id"]
            isOneToOne: false
            referencedRelation: "gabinetes"
            referencedColumns: ["id"]
          },
        ]
      }
      indication_tags: {
        Row: {
          category: string
          color: string
          created_at: string
          icon: string | null
          id: string
          name: string
          tag_type: string
        }
        Insert: {
          category: string
          color: string
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          tag_type: string
        }
        Update: {
          category?: string
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          tag_type?: string
        }
        Relationships: []
      }
      meu_assessor_ia: {
        Row: {
          comportamento: string
          created_at: string | null
          created_by: string
          foto_url: string | null
          gabinete_id: string
          id: string
          mensagem_boas_vindas: string | null
          nome: string
          numero_whatsapp: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          comportamento?: string
          created_at?: string | null
          created_by: string
          foto_url?: string | null
          gabinete_id: string
          id?: string
          mensagem_boas_vindas?: string | null
          nome: string
          numero_whatsapp?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          comportamento?: string
          created_at?: string | null
          created_by?: string
          foto_url?: string | null
          gabinete_id?: string
          id?: string
          mensagem_boas_vindas?: string | null
          nome?: string
          numero_whatsapp?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meu_assessor_ia_gabinete_id_fkey"
            columns: ["gabinete_id"]
            isOneToOne: true
            referencedRelation: "gabinetes"
            referencedColumns: ["id"]
          },
        ]
      }
      partidos_politicos: {
        Row: {
          created_at: string | null
          id: string
          logomarca_url: string | null
          nome: string
          numero: number
          sigla: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          logomarca_url?: string | null
          nome: string
          numero: number
          sigla: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          logomarca_url?: string | null
          nome?: string
          numero?: number
          sigla?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string | null
          description: string | null
          features: string[] | null
          id: string
          image: string | null
          is_active: boolean | null
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          features?: string[] | null
          id?: string
          image?: string | null
          is_active?: boolean | null
          name: string
          price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          features?: string[] | null
          id?: string
          image?: string | null
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          camara_id: string | null
          cidade_id: string | null
          cpf: string | null
          created_at: string
          data_nascimento: string | null
          endereco: string | null
          estado_id: string | null
          full_name: string | null
          genero: string | null
          id: string
          main_role: Database["public"]["Enums"]["user_role_type"] | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          camara_id?: string | null
          cidade_id?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          endereco?: string | null
          estado_id?: string | null
          full_name?: string | null
          genero?: string | null
          id?: string
          main_role?: Database["public"]["Enums"]["user_role_type"] | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          camara_id?: string | null
          cidade_id?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          endereco?: string | null
          estado_id?: string | null
          full_name?: string | null
          genero?: string | null
          id?: string
          main_role?: Database["public"]["Enums"]["user_role_type"] | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_camara_id_fkey"
            columns: ["camara_id"]
            isOneToOne: false
            referencedRelation: "camaras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_cidade_id_fkey"
            columns: ["cidade_id"]
            isOneToOne: false
            referencedRelation: "cidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_estado_id_fkey"
            columns: ["estado_id"]
            isOneToOne: false
            referencedRelation: "estados"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      view_audit_logs: {
        Row: {
          acao: string | null
          created_at: string | null
          executor_cargo: Database["public"]["Enums"]["user_role_type"] | null
          executor_nome: string | null
          gabinete_id: string | null
          id: string | null
          metadata: Json | null
          registro_id: string | null
          status_anterior: string | null
          status_novo: string | null
          tabela: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_gabinete_id_fkey"
            columns: ["gabinete_id"]
            isOneToOne: false
            referencedRelation: "gabinetes"
            referencedColumns: ["id"]
          },
        ]
      }
      view_dashboard_demandas_bairro: {
        Row: {
          bairro: string | null
          gabinete_id: string | null
          resolvidas: number | null
          tempo_medio_segundos: number | null
          total_demandas: number | null
        }
        Relationships: [
          {
            foreignKeyName: "demandas_gabinete_id_fkey"
            columns: ["gabinete_id"]
            isOneToOne: false
            referencedRelation: "gabinetes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_manage_cabinet: {
        Args: { target_gabinete_id: string }
        Returns: boolean
      }
      finalizar_onboarding: {
        Args: {
          p_camara_id: string
          p_cidade_id: string
          p_cpf: string
          p_data_nascimento: string
          p_estado_id: string
          p_full_name: string
          p_gabinete_nome: string
          p_genero: string
          p_logo_url: string
          p_partido_id: string
          p_politician_name: string
          p_user_id: string
          p_whatsapp: string
        }
        Returns: string
      }
      get_gabinete_members_with_profiles: {
        Args: { gab_id: string }
        Returns: {
          avatar_url: string
          full_name: string
          role: string
          user_id: string
        }[]
      }
      user_belongs_to_gabinete: {
        Args: { target_gabinete_id: string }
        Returns: boolean
      }
      user_has_permission: {
        Args: { required_permission: string }
        Returns: boolean
      }
    }
    Enums: {
      camara_tipo: "municipal" | "estadual" | "federal"
      gabinete_status: "ativo" | "inativo" | "suspenso"
      user_role_type:
      | "admin_plataforma"
      | "politico"
      | "chefe_gabinete"
      | "assessor"
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
      camara_tipo: ["municipal", "estadual", "federal"],
      gabinete_status: ["ativo", "inativo", "suspenso"],
      user_role_type: [
        "admin_plataforma",
        "politico",
        "chefe_gabinete",
        "assessor",
      ],
    },
  },
} as const
