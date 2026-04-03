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
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      admin_message_reads: {
        Row: {
          id: string
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "admin_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          priority: string
          recipient_id: string | null
          sender_id: string
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          priority?: string
          recipient_id?: string | null
          sender_id: string
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          priority?: string
          recipient_id?: string | null
          sender_id?: string
          title?: string
        }
        Relationships: []
      }
      ai_content_cache: {
        Row: {
          cache_key: string
          content_json: Json
          content_type: string
          created_at: string
          expires_at: string | null
          hit_count: number
          id: string
          model_used: string | null
          quality_score: number | null
          updated_at: string
        }
        Insert: {
          cache_key: string
          content_json: Json
          content_type?: string
          created_at?: string
          expires_at?: string | null
          hit_count?: number
          id?: string
          model_used?: string | null
          quality_score?: number | null
          updated_at?: string
        }
        Update: {
          cache_key?: string
          content_json?: Json
          content_type?: string
          created_at?: string
          expires_at?: string | null
          hit_count?: number
          id?: string
          model_used?: string | null
          quality_score?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          cache_hit: boolean | null
          cost_estimate: number | null
          created_at: string
          error_message: string | null
          function_name: string
          id: string
          model_tier: string | null
          model_used: string | null
          response_time_ms: number | null
          success: boolean
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          cache_hit?: boolean | null
          cost_estimate?: number | null
          created_at?: string
          error_message?: string | null
          function_name: string
          id?: string
          model_tier?: string | null
          model_used?: string | null
          response_time_ms?: number | null
          success?: boolean
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          cache_hit?: boolean | null
          cost_estimate?: number | null
          created_at?: string
          error_message?: string | null
          function_name?: string
          id?: string
          model_tier?: string | null
          model_used?: string | null
          response_time_ms?: number | null
          success?: boolean
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: []
      }
      anamnesis_interactions: {
        Row: {
          category: string | null
          coaching_tip: string | null
          created_at: string
          id: string
          patient_response: string | null
          quality_score: number | null
          question_text: string
          session_id: string
          user_id: string
        }
        Insert: {
          category?: string | null
          coaching_tip?: string | null
          created_at?: string
          id?: string
          patient_response?: string | null
          quality_score?: number | null
          question_text: string
          session_id: string
          user_id: string
        }
        Update: {
          category?: string | null
          coaching_tip?: string | null
          created_at?: string
          id?: string
          patient_response?: string | null
          quality_score?: number | null
          question_text?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "anamnesis_interactions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "anamnesis_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      anamnesis_results: {
        Row: {
          categories_covered: Json
          conversation_history: Json | null
          created_at: string
          difficulty: string
          final_score: number | null
          grade: string | null
          id: string
          ideal_anamnesis: string | null
          specialty: string
          time_total_minutes: number | null
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          categories_covered?: Json
          conversation_history?: Json | null
          created_at?: string
          difficulty?: string
          final_score?: number | null
          grade?: string | null
          id?: string
          ideal_anamnesis?: string | null
          specialty: string
          time_total_minutes?: number | null
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          categories_covered?: Json
          conversation_history?: Json | null
          created_at?: string
          difficulty?: string
          final_score?: number | null
          grade?: string | null
          id?: string
          ideal_anamnesis?: string | null
          specialty?: string
          time_total_minutes?: number | null
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: []
      }
      anamnesis_sessions: {
        Row: {
          categories_covered: Json
          created_at: string
          difficulty: string
          final_score: number | null
          finished_at: string | null
          id: string
          scenario_id: string | null
          session_origin: string
          specialty: string
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          categories_covered?: Json
          created_at?: string
          difficulty?: string
          final_score?: number | null
          finished_at?: string | null
          id?: string
          scenario_id?: string | null
          session_origin?: string
          specialty: string
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          categories_covered?: Json
          created_at?: string
          difficulty?: string
          final_score?: number | null
          finished_at?: string | null
          id?: string
          scenario_id?: string | null
          session_origin?: string
          specialty?: string
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "anamnesis_sessions_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "clinical_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_scores: {
        Row: {
          accuracy: number
          consistency_score: number
          created_at: string
          details_json: Json | null
          domain_score: number
          error_penalty: number
          id: string
          review_score: number
          score: number
          simulation_score: number
          user_id: string
        }
        Insert: {
          accuracy?: number
          consistency_score?: number
          created_at?: string
          details_json?: Json | null
          domain_score?: number
          error_penalty?: number
          id?: string
          review_score?: number
          score?: number
          simulation_score?: number
          user_id: string
        }
        Update: {
          accuracy?: number
          consistency_score?: number
          created_at?: string
          details_json?: Json | null
          domain_score?: number
          error_penalty?: number
          id?: string
          review_score?: number
          score?: number
          simulation_score?: number
          user_id?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          agent_type: string
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_type: string
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_type?: string
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chronicle_favorites: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          notes: string | null
          specialty: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          notes?: string | null
          specialty?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          specialty?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chronicle_favorites_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chronicle_osce_sessions: {
        Row: {
          chronicle_id: string
          created_at: string
          decisions: Json | null
          evaluation: Json | null
          id: string
          score: number | null
          time_seconds: number | null
          user_id: string
        }
        Insert: {
          chronicle_id: string
          created_at?: string
          decisions?: Json | null
          evaluation?: Json | null
          id?: string
          score?: number | null
          time_seconds?: number | null
          user_id: string
        }
        Update: {
          chronicle_id?: string
          created_at?: string
          decisions?: Json | null
          evaluation?: Json | null
          id?: string
          score?: number | null
          time_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chronicle_osce_sessions_chronicle_id_fkey"
            columns: ["chronicle_id"]
            isOneToOne: false
            referencedRelation: "medical_chronicles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_members: {
        Row: {
          class_id: string
          id: string
          is_active: boolean | null
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          class_id: string
          id?: string
          is_active?: boolean | null
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          class_id?: string
          id?: string
          is_active?: boolean | null
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_members_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          created_by: string
          id: string
          institution_id: string
          invite_code: string | null
          is_active: boolean | null
          name: string
          period: number | null
          updated_at: string
          year: number | null
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          institution_id: string
          invite_code?: string | null
          is_active?: boolean | null
          name: string
          period?: number | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          institution_id?: string
          invite_code?: string | null
          is_active?: boolean | null
          name?: string
          period?: number | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_cases: {
        Row: {
          clinical_history: string
          correct_diagnosis: string
          created_at: string | null
          differential_diagnoses: Json | null
          difficulty: number | null
          explanation: string | null
          id: string
          imaging: string | null
          is_global: boolean | null
          lab_results: Json | null
          physical_exam: string | null
          source: string | null
          specialty: string
          title: string
          treatment: string | null
          user_id: string
          vitals: Json | null
        }
        Insert: {
          clinical_history: string
          correct_diagnosis: string
          created_at?: string | null
          differential_diagnoses?: Json | null
          difficulty?: number | null
          explanation?: string | null
          id?: string
          imaging?: string | null
          is_global?: boolean | null
          lab_results?: Json | null
          physical_exam?: string | null
          source?: string | null
          specialty: string
          title: string
          treatment?: string | null
          user_id: string
          vitals?: Json | null
        }
        Update: {
          clinical_history?: string
          correct_diagnosis?: string
          created_at?: string | null
          differential_diagnoses?: Json | null
          difficulty?: number | null
          explanation?: string | null
          id?: string
          imaging?: string | null
          is_global?: boolean | null
          lab_results?: Json | null
          physical_exam?: string | null
          source?: string | null
          specialty?: string
          title?: string
          treatment?: string | null
          user_id?: string
          vitals?: Json | null
        }
        Relationships: []
      }
      clinical_scenarios: {
        Row: {
          created_at: string
          created_by: string | null
          difficulty: string
          id: string
          is_global: boolean
          scenario_data: Json
          scenario_type: string
          specialty: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          difficulty?: string
          id?: string
          is_global?: boolean
          scenario_data?: Json
          scenario_type?: string
          specialty: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          difficulty?: string
          id?: string
          is_global?: boolean
          scenario_data?: Json
          scenario_type?: string
          specialty?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      cronograma_config: {
        Row: {
          created_at: string | null
          dias_revisao: Json | null
          id: string
          max_revisoes_dia: number | null
          meta_questoes_dia: number | null
          meta_revisoes_semana: number | null
          mostrar_concluidos: boolean | null
          pesos_algoritmo: Json | null
          revisoes_extras_ativas: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dias_revisao?: Json | null
          id?: string
          max_revisoes_dia?: number | null
          meta_questoes_dia?: number | null
          meta_revisoes_semana?: number | null
          mostrar_concluidos?: boolean | null
          pesos_algoritmo?: Json | null
          revisoes_extras_ativas?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          dias_revisao?: Json | null
          id?: string
          max_revisoes_dia?: number | null
          meta_questoes_dia?: number | null
          meta_revisoes_semana?: number | null
          mostrar_concluidos?: boolean | null
          pesos_algoritmo?: Json | null
          revisoes_extras_ativas?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      daily_generation_log: {
        Row: {
          created_at: string
          id: string
          questions_generated: number
          run_date: string
          specialties_processed: Json
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          questions_generated?: number
          run_date?: string
          specialties_processed?: Json
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          questions_generated?: number
          run_date?: string
          specialties_processed?: Json
          status?: string
        }
        Relationships: []
      }
      daily_plans: {
        Row: {
          completed_blocks: Json
          completed_count: number
          created_at: string | null
          id: string
          plan_date: string
          plan_json: Json
          total_blocks: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_blocks?: Json
          completed_count?: number
          created_at?: string | null
          id?: string
          plan_date?: string
          plan_json?: Json
          total_blocks?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_blocks?: Json
          completed_count?: number
          created_at?: string | null
          id?: string
          plan_date?: string
          plan_json?: Json
          total_blocks?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      desempenho_questoes: {
        Row: {
          created_at: string
          data_registro: string
          id: string
          nivel_confianca: string | null
          observacoes: string | null
          questoes_erradas: number
          questoes_feitas: number
          revisao_id: string | null
          taxa_acerto: number
          tema_id: string
          tempo_gasto: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          data_registro?: string
          id?: string
          nivel_confianca?: string | null
          observacoes?: string | null
          questoes_erradas?: number
          questoes_feitas?: number
          revisao_id?: string | null
          taxa_acerto?: number
          tema_id: string
          tempo_gasto?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          data_registro?: string
          id?: string
          nivel_confianca?: string | null
          observacoes?: string | null
          questoes_erradas?: number
          questoes_feitas?: number
          revisao_id?: string | null
          taxa_acerto?: number
          tema_id?: string
          tempo_gasto?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "desempenho_questoes_revisao_id_fkey"
            columns: ["revisao_id"]
            isOneToOne: false
            referencedRelation: "revisoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "desempenho_questoes_tema_id_fkey"
            columns: ["tema_id"]
            isOneToOne: false
            referencedRelation: "temas_estudados"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_results: {
        Row: {
          completed_at: string
          created_at: string
          id: string
          results_json: Json | null
          score: number
          total_questions: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          id?: string
          results_json?: Json | null
          score?: number
          total_questions?: number
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          id?: string
          results_json?: Json | null
          score?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      diagnostic_sessions: {
        Row: {
          areas_evaluated: Json
          correct_count: number
          created_at: string
          cycle: string
          finished_at: string | null
          id: string
          score: number
          started_at: string
          total_questions: number
          user_id: string
        }
        Insert: {
          areas_evaluated?: Json
          correct_count?: number
          created_at?: string
          cycle?: string
          finished_at?: string | null
          id?: string
          score?: number
          started_at?: string
          total_questions?: number
          user_id: string
        }
        Update: {
          areas_evaluated?: Json
          correct_count?: number
          created_at?: string
          cycle?: string
          finished_at?: string | null
          id?: string
          score?: number
          started_at?: string
          total_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      diagnostic_topic_results: {
        Row: {
          accuracy: number
          avg_time_seconds: number | null
          correct: number
          created_at: string
          id: string
          session_id: string
          topic: string
          total: number
          user_id: string
        }
        Insert: {
          accuracy?: number
          avg_time_seconds?: number | null
          correct?: number
          created_at?: string
          id?: string
          session_id: string
          topic: string
          total?: number
          user_id: string
        }
        Update: {
          accuracy?: number
          avg_time_seconds?: number | null
          correct?: number
          created_at?: string
          id?: string
          session_id?: string
          topic?: string
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_topic_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      discursive_attempts: {
        Row: {
          ai_correction: Json | null
          created_at: string
          finished_at: string | null
          id: string
          max_score: number | null
          question_text: string
          score: number | null
          specialty: string
          status: string
          student_answer: string | null
          user_id: string
        }
        Insert: {
          ai_correction?: Json | null
          created_at?: string
          finished_at?: string | null
          id?: string
          max_score?: number | null
          question_text: string
          score?: number | null
          specialty: string
          status?: string
          student_answer?: string | null
          user_id: string
        }
        Update: {
          ai_correction?: Json | null
          created_at?: string
          finished_at?: string | null
          id?: string
          max_score?: number | null
          question_text?: string
          score?: number | null
          specialty?: string
          status?: string
          student_answer?: string | null
          user_id?: string
        }
        Relationships: []
      }
      enazizi_progress: {
        Row: {
          created_at: string
          estado_atual: number
          historico_estudo: Json
          id: string
          pontuacao_discursiva: number | null
          questoes_respondidas: number
          taxa_acerto: number
          tema_atual: string | null
          temas_fracos: Json
          ultima_interacao: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          estado_atual?: number
          historico_estudo?: Json
          id?: string
          pontuacao_discursiva?: number | null
          questoes_respondidas?: number
          taxa_acerto?: number
          tema_atual?: string | null
          temas_fracos?: Json
          ultima_interacao?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          estado_atual?: number
          historico_estudo?: Json
          id?: string
          pontuacao_discursiva?: number | null
          questoes_respondidas?: number
          taxa_acerto?: number
          tema_atual?: string | null
          temas_fracos?: Json
          ultima_interacao?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      error_bank: {
        Row: {
          categoria_erro: string | null
          conteudo: string | null
          created_at: string
          dificuldade: number | null
          dominado: boolean | null
          dominado_em: string | null
          id: string
          motivo_erro: string | null
          subtema: string | null
          tema: string
          tipo_questao: string
          updated_at: string
          user_id: string
          vezes_errado: number
        }
        Insert: {
          categoria_erro?: string | null
          conteudo?: string | null
          created_at?: string
          dificuldade?: number | null
          dominado?: boolean | null
          dominado_em?: string | null
          id?: string
          motivo_erro?: string | null
          subtema?: string | null
          tema: string
          tipo_questao?: string
          updated_at?: string
          user_id: string
          vezes_errado?: number
        }
        Update: {
          categoria_erro?: string | null
          conteudo?: string | null
          created_at?: string
          dificuldade?: number | null
          dominado?: boolean | null
          dominado_em?: string | null
          id?: string
          motivo_erro?: string | null
          subtema?: string | null
          tema?: string
          tipo_questao?: string
          updated_at?: string
          user_id?: string
          vezes_errado?: number
        }
        Relationships: []
      }
      exam_banks: {
        Row: {
          banca: string
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          source_tag: string
          specialty: string | null
          time_limit_minutes: number | null
          total_questions: number | null
          year: number
        }
        Insert: {
          banca: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          source_tag: string
          specialty?: string | null
          time_limit_minutes?: number | null
          total_questions?: number | null
          year: number
        }
        Update: {
          banca?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          source_tag?: string
          specialty?: string | null
          time_limit_minutes?: number | null
          total_questions?: number | null
          year?: number
        }
        Relationships: []
      }
      exam_sessions: {
        Row: {
          answers_json: Json | null
          created_at: string
          finished_at: string | null
          id: string
          organization_id: string | null
          results_json: Json | null
          score: number | null
          started_at: string
          status: string
          time_limit_minutes: number
          title: string
          total_questions: number
          user_id: string
        }
        Insert: {
          answers_json?: Json | null
          created_at?: string
          finished_at?: string | null
          id?: string
          organization_id?: string | null
          results_json?: Json | null
          score?: number | null
          started_at?: string
          status?: string
          time_limit_minutes?: number
          title?: string
          total_questions?: number
          user_id: string
        }
        Update: {
          answers_json?: Json | null
          created_at?: string
          finished_at?: string | null
          id?: string
          organization_id?: string | null
          results_json?: Json | null
          score?: number | null
          started_at?: string
          status?: string
          time_limit_minutes?: number
          title?: string
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      external_exam_sources: {
        Row: {
          created_at: string
          created_by: string | null
          error_message: string | null
          exam_info: string | null
          extracted_questions_count: number
          id: string
          permission_type: string
          processing_status: string
          source_type: string
          source_url: string
          specialty: string | null
          title: string
          year: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          exam_info?: string | null
          extracted_questions_count?: number
          id?: string
          permission_type?: string
          processing_status?: string
          source_type?: string
          source_url: string
          specialty?: string | null
          title: string
          year?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          exam_info?: string | null
          extracted_questions_count?: number
          id?: string
          permission_type?: string
          processing_status?: string
          source_type?: string
          source_url?: string
          specialty?: string | null
          title?: string
          year?: number | null
        }
        Relationships: []
      }
      flashcards: {
        Row: {
          answer: string
          created_at: string
          id: string
          is_global: boolean
          organization_id: string | null
          question: string
          topic: string | null
          user_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          is_global?: boolean
          organization_id?: string | null
          question: string
          topic?: string | null
          user_id: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          is_global?: boolean
          organization_id?: string | null
          question?: string
          topic?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      fsrs_cards: {
        Row: {
          card_ref_id: string
          card_type: string
          created_at: string
          difficulty: number
          due: string
          elapsed_days: number
          id: string
          lapses: number
          last_review: string | null
          reps: number
          scheduled_days: number
          stability: number
          state: number
          updated_at: string
          user_id: string
        }
        Insert: {
          card_ref_id: string
          card_type?: string
          created_at?: string
          difficulty?: number
          due?: string
          elapsed_days?: number
          id?: string
          lapses?: number
          last_review?: string | null
          reps?: number
          scheduled_days?: number
          stability?: number
          state?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          card_ref_id?: string
          card_type?: string
          created_at?: string
          difficulty?: number
          due?: string
          elapsed_days?: number
          id?: string
          lapses?: number
          last_review?: string | null
          reps?: number
          scheduled_days?: number
          stability?: number
          state?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fsrs_review_log: {
        Row: {
          card_id: string
          elapsed_days: number | null
          id: string
          rating: number
          review_duration_ms: number | null
          reviewed_at: string
          scheduled_days: number | null
          user_id: string
        }
        Insert: {
          card_id: string
          elapsed_days?: number | null
          id?: string
          rating: number
          review_duration_ms?: number | null
          reviewed_at?: string
          scheduled_days?: number | null
          user_id: string
        }
        Update: {
          card_id?: string
          elapsed_days?: number | null
          id?: string
          rating?: number
          review_duration_ms?: number | null
          reviewed_at?: string
          scheduled_days?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fsrs_review_log_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "fsrs_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_jobs: {
        Row: {
          created_at: string
          id: string
          job_type: string
          last_error: string | null
          processed_batches: number
          processed_specialties: Json
          progress_pct: number
          remaining_specialties: Json
          result_json: Json
          started_by: string | null
          status: string
          total_batches: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_type?: string
          last_error?: string | null
          processed_batches?: number
          processed_specialties?: Json
          progress_pct?: number
          remaining_specialties?: Json
          result_json?: Json
          started_by?: string | null
          status?: string
          total_batches?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          job_type?: string
          last_error?: string | null
          processed_batches?: number
          processed_specialties?: Json
          progress_pct?: number
          remaining_specialties?: Json
          result_json?: Json
          started_by?: string | null
          status?: string
          total_batches?: number
          updated_at?: string
        }
        Relationships: []
      }
      ingestion_log: {
        Row: {
          banca: string | null
          created_at: string
          created_by: string | null
          duplicates_skipped: number
          errors: number
          id: string
          permission_type: string
          questions_found: number
          questions_inserted: number
          questions_updated: number
          source_name: string
          source_type: string
          source_url: string | null
          status: string
          year: number | null
        }
        Insert: {
          banca?: string | null
          created_at?: string
          created_by?: string | null
          duplicates_skipped?: number
          errors?: number
          id?: string
          permission_type?: string
          questions_found?: number
          questions_inserted?: number
          questions_updated?: number
          source_name: string
          source_type?: string
          source_url?: string | null
          status?: string
          year?: number | null
        }
        Update: {
          banca?: string | null
          created_at?: string
          created_by?: string | null
          duplicates_skipped?: number
          errors?: number
          id?: string
          permission_type?: string
          questions_found?: number
          questions_inserted?: number
          questions_updated?: number
          source_name?: string
          source_type?: string
          source_url?: string | null
          status?: string
          year?: number | null
        }
        Relationships: []
      }
      institution_members: {
        Row: {
          id: string
          institution_id: string
          is_active: boolean | null
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          institution_id: string
          is_active?: boolean | null
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          id?: string
          institution_id?: string
          is_active?: boolean | null
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "institution_members_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          logo_url: string | null
          max_users: number | null
          name: string
          settings_json: Json | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          max_users?: number | null
          name: string
          settings_json?: Json | null
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          max_users?: number | null
          name?: string
          settings_json?: Json | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      medical_chronicles: {
        Row: {
          content: string
          created_at: string
          difficulty: string
          id: string
          osce_payload: Json | null
          specialty: string
          structured_data: Json | null
          subtopic: string | null
          topic: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          difficulty?: string
          id?: string
          osce_payload?: Json | null
          specialty: string
          structured_data?: Json | null
          subtopic?: string | null
          topic: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          difficulty?: string
          id?: string
          osce_payload?: Json | null
          specialty?: string
          structured_data?: Json | null
          subtopic?: string | null
          topic?: string
          user_id?: string
        }
        Relationships: []
      }
      medical_domain_map: {
        Row: {
          avg_difficulty: number
          clinical_cases_score: number
          correct_answers: number
          created_at: string
          domain_score: number
          errors_count: number
          id: string
          last_studied_at: string | null
          questions_answered: number
          reviews_count: number
          specialty: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_difficulty?: number
          clinical_cases_score?: number
          correct_answers?: number
          created_at?: string
          domain_score?: number
          errors_count?: number
          id?: string
          last_studied_at?: string | null
          questions_answered?: number
          reviews_count?: number
          specialty: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_difficulty?: number
          clinical_cases_score?: number
          correct_answers?: number
          created_at?: string
          domain_score?: number
          errors_count?: number
          id?: string
          last_studied_at?: string | null
          questions_answered?: number
          reviews_count?: number
          specialty?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      medical_image_attempts: {
        Row: {
          correct: boolean
          created_at: string
          id: string
          image_id: string
          selected_index: number
          time_seconds: number | null
          user_id: string
        }
        Insert: {
          correct: boolean
          created_at?: string
          id?: string
          image_id: string
          selected_index: number
          time_seconds?: number | null
          user_id: string
        }
        Update: {
          correct?: boolean
          created_at?: string
          id?: string
          image_id?: string
          selected_index?: number
          time_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_image_attempts_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "medical_images"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_images: {
        Row: {
          category: string
          correct_index: number
          created_at: string
          created_by: string | null
          diagnosis: string
          difficulty: number
          explanation: string | null
          id: string
          image_source: string | null
          image_url: string
          is_active: boolean
          options: Json
          subcategory: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          category?: string
          correct_index?: number
          created_at?: string
          created_by?: string | null
          diagnosis: string
          difficulty?: number
          explanation?: string | null
          id?: string
          image_source?: string | null
          image_url: string
          is_active?: boolean
          options?: Json
          subcategory?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          category?: string
          correct_index?: number
          created_at?: string
          created_by?: string | null
          diagnosis?: string
          difficulty?: number
          explanation?: string | null
          id?: string
          image_source?: string | null
          image_url?: string
          is_active?: boolean
          options?: Json
          subcategory?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      medical_terms: {
        Row: {
          aliases: string[] | null
          created_at: string | null
          definition_json: Json | null
          id: string
          specialty: string | null
          term: string
          updated_at: string | null
        }
        Insert: {
          aliases?: string[] | null
          created_at?: string | null
          definition_json?: Json | null
          id?: string
          specialty?: string | null
          term: string
          updated_at?: string | null
        }
        Update: {
          aliases?: string[] | null
          created_at?: string | null
          definition_json?: Json | null
          id?: string
          specialty?: string | null
          term?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      mentor_theme_plan_progress: {
        Row: {
          correct_answers: number
          created_at: string
          id: string
          plan_id: string
          questions_answered: number
          status: string
          study_time_minutes: number
          topic_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          correct_answers?: number
          created_at?: string
          id?: string
          plan_id: string
          questions_answered?: number
          status?: string
          study_time_minutes?: number
          topic_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          correct_answers?: number
          created_at?: string
          id?: string
          plan_id?: string
          questions_answered?: number
          status?: string
          study_time_minutes?: number
          topic_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_theme_plan_progress_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "mentor_theme_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_theme_plan_progress_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "mentor_theme_plan_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_theme_plan_targets: {
        Row: {
          created_at: string
          id: string
          plan_id: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan_id: string
          target_id: string
          target_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          plan_id?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_theme_plan_targets_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "mentor_theme_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_theme_plan_topics: {
        Row: {
          created_at: string
          id: string
          plan_id: string
          priority: number
          subtopic: string | null
          topic: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan_id: string
          priority?: number
          subtopic?: string | null
          topic: string
        }
        Update: {
          created_at?: string
          id?: string
          plan_id?: string
          priority?: number
          subtopic?: string | null
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_theme_plan_topics_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "mentor_theme_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_theme_plans: {
        Row: {
          created_at: string
          description: string | null
          exam_date: string | null
          id: string
          name: string
          professor_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          exam_date?: string | null
          id?: string
          name: string
          professor_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          exam_date?: string | null
          id?: string
          name?: string
          professor_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      module_sessions: {
        Row: {
          created_at: string
          id: string
          module_key: string
          session_data: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          module_key: string
          session_data?: Json
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          module_key?: string
          session_data?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      performance_predictions: {
        Row: {
          approval_probability: number
          created_at: string
          details_json: Json | null
          estimated_ranking: number | null
          estimated_score: number
          id: string
          predicted_at: string
          trend: string | null
          user_id: string
        }
        Insert: {
          approval_probability?: number
          created_at?: string
          details_json?: Json | null
          estimated_ranking?: number | null
          estimated_score?: number
          id?: string
          predicted_at?: string
          trend?: string | null
          user_id: string
        }
        Update: {
          approval_probability?: number
          created_at?: string
          details_json?: Json | null
          estimated_ranking?: number | null
          estimated_score?: number
          id?: string
          predicted_at?: string
          trend?: string | null
          user_id?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string
          features_json: Json | null
          id: string
          name: string
          price: number
        }
        Insert: {
          created_at?: string
          features_json?: Json | null
          id?: string
          name: string
          price?: number
        }
        Update: {
          created_at?: string
          features_json?: Json | null
          id?: string
          name?: string
          price?: number
        }
        Relationships: []
      }
      platform_config: {
        Row: {
          id: number
          telegram_chat_id: string | null
          telegram_group_link: string | null
          updated_at: string
        }
        Insert: {
          id: number
          telegram_chat_id?: string | null
          telegram_group_link?: string | null
          updated_at?: string
        }
        Update: {
          id?: number
          telegram_chat_id?: string | null
          telegram_group_link?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      practical_exam_results: {
        Row: {
          case_summary: string | null
          created_at: string
          difficulty: string
          feedback_json: Json
          final_score: number
          id: string
          scores_json: Json
          specialty: string
          steps_json: Json
          time_total_seconds: number
          user_id: string
        }
        Insert: {
          case_summary?: string | null
          created_at?: string
          difficulty?: string
          feedback_json?: Json
          final_score?: number
          id?: string
          scores_json?: Json
          specialty: string
          steps_json?: Json
          time_total_seconds?: number
          user_id: string
        }
        Update: {
          case_summary?: string | null
          created_at?: string
          difficulty?: string
          feedback_json?: Json
          final_score?: number
          id?: string
          scores_json?: Json
          specialty?: string
          steps_json?: Json
          time_total_seconds?: number
          user_id?: string
        }
        Relationships: []
      }
      practice_attempts: {
        Row: {
          correct: boolean
          created_at: string
          id: string
          question_id: string
          user_id: string
        }
        Insert: {
          correct: boolean
          created_at?: string
          id?: string
          question_id: string
          user_id: string
        }
        Update: {
          correct?: boolean
          created_at?: string
          id?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions_bank"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          created_at: string
          daily_study_hours: number | null
          display_name: string | null
          email: string | null
          exam_date: string | null
          experience_reset_at: string | null
          faculdade: string | null
          has_completed_diagnostic: boolean | null
          id: string
          is_blocked: boolean
          last_onboarding_step: number | null
          onboarding_version: number
          organization_id: string | null
          periodo: number | null
          phone: string | null
          status: string
          target_exam: string | null
          target_specialty: string | null
          updated_at: string
          user_id: string
          user_type: string
          whatsapp_daily_bi: boolean
          whatsapp_opt_out: boolean
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          created_at?: string
          daily_study_hours?: number | null
          display_name?: string | null
          email?: string | null
          exam_date?: string | null
          experience_reset_at?: string | null
          faculdade?: string | null
          has_completed_diagnostic?: boolean | null
          id?: string
          is_blocked?: boolean
          last_onboarding_step?: number | null
          onboarding_version?: number
          organization_id?: string | null
          periodo?: number | null
          phone?: string | null
          status?: string
          target_exam?: string | null
          target_specialty?: string | null
          updated_at?: string
          user_id: string
          user_type?: string
          whatsapp_daily_bi?: boolean
          whatsapp_opt_out?: boolean
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          created_at?: string
          daily_study_hours?: number | null
          display_name?: string | null
          email?: string | null
          exam_date?: string | null
          experience_reset_at?: string | null
          faculdade?: string | null
          has_completed_diagnostic?: boolean | null
          id?: string
          is_blocked?: boolean
          last_onboarding_step?: number | null
          onboarding_version?: number
          organization_id?: string | null
          periodo?: number | null
          phone?: string | null
          status?: string
          target_exam?: string | null
          target_specialty?: string | null
          updated_at?: string
          user_id?: string
          user_type?: string
          whatsapp_daily_bi?: boolean
          whatsapp_opt_out?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      qa_test_results: {
        Row: {
          created_at: string
          details_json: Json | null
          duration_ms: number | null
          error_message: string | null
          id: string
          module_tested: string | null
          run_id: string
          status: string
          suggestion: string | null
          test_name: string
          test_suite: string
        }
        Insert: {
          created_at?: string
          details_json?: Json | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          module_tested?: string | null
          run_id: string
          status?: string
          suggestion?: string | null
          test_name: string
          test_suite: string
        }
        Update: {
          created_at?: string
          details_json?: Json | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          module_tested?: string | null
          run_id?: string
          status?: string
          suggestion?: string | null
          test_name?: string
          test_suite?: string
        }
        Relationships: [
          {
            foreignKeyName: "qa_test_results_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "qa_test_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      qa_test_runs: {
        Row: {
          created_at: string
          duration_ms: number | null
          failed_tests: number
          finished_at: string | null
          id: string
          passed_tests: number
          run_type: string
          started_at: string
          status: string
          summary_json: Json | null
          total_tests: number
          warning_tests: number
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          failed_tests?: number
          finished_at?: string | null
          id?: string
          passed_tests?: number
          run_type?: string
          started_at?: string
          status?: string
          summary_json?: Json | null
          total_tests?: number
          warning_tests?: number
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          failed_tests?: number
          finished_at?: string | null
          id?: string
          passed_tests?: number
          run_type?: string
          started_at?: string
          status?: string
          summary_json?: Json | null
          total_tests?: number
          warning_tests?: number
        }
        Relationships: []
      }
      questions_bank: {
        Row: {
          correct_index: number | null
          created_at: string
          difficulty: number | null
          exam_bank_id: string | null
          explanation: string | null
          id: string
          image_url: string | null
          is_global: boolean | null
          options: Json | null
          organization_id: string | null
          original_question_id: string | null
          permission_type: string | null
          question_order: number | null
          review_status: string | null
          source: string | null
          source_type: string | null
          source_url: string | null
          statement: string
          subtopic: string | null
          topic: string | null
          user_id: string
        }
        Insert: {
          correct_index?: number | null
          created_at?: string
          difficulty?: number | null
          exam_bank_id?: string | null
          explanation?: string | null
          id?: string
          image_url?: string | null
          is_global?: boolean | null
          options?: Json | null
          organization_id?: string | null
          original_question_id?: string | null
          permission_type?: string | null
          question_order?: number | null
          review_status?: string | null
          source?: string | null
          source_type?: string | null
          source_url?: string | null
          statement: string
          subtopic?: string | null
          topic?: string | null
          user_id: string
        }
        Update: {
          correct_index?: number | null
          created_at?: string
          difficulty?: number | null
          exam_bank_id?: string | null
          explanation?: string | null
          id?: string
          image_url?: string | null
          is_global?: boolean | null
          options?: Json | null
          organization_id?: string | null
          original_question_id?: string | null
          permission_type?: string | null
          question_order?: number | null
          review_status?: string | null
          source?: string | null
          source_type?: string | null
          source_url?: string | null
          statement?: string
          subtopic?: string | null
          topic?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_bank_exam_bank_id_fkey"
            columns: ["exam_bank_id"]
            isOneToOne: false
            referencedRelation: "exam_banks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_bank_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_bank_original_question_id_fkey"
            columns: ["original_question_id"]
            isOneToOne: false
            referencedRelation: "questions_bank"
            referencedColumns: ["id"]
          },
        ]
      }
      ranking_snapshots: {
        Row: {
          consistency_rank: number | null
          consistency_rank_delta: number | null
          consistency_score: number
          created_at: string
          details_json: Json | null
          evolution_rank: number | null
          evolution_rank_delta: number | null
          evolution_score: number
          id: string
          percentile: number | null
          performance_rank: number | null
          performance_rank_delta: number | null
          performance_score: number
          practical_rank: number | null
          practical_rank_delta: number | null
          practical_score: number
          snapshot_date: string
          user_id: string
        }
        Insert: {
          consistency_rank?: number | null
          consistency_rank_delta?: number | null
          consistency_score?: number
          created_at?: string
          details_json?: Json | null
          evolution_rank?: number | null
          evolution_rank_delta?: number | null
          evolution_score?: number
          id?: string
          percentile?: number | null
          performance_rank?: number | null
          performance_rank_delta?: number | null
          performance_score?: number
          practical_rank?: number | null
          practical_rank_delta?: number | null
          practical_score?: number
          snapshot_date?: string
          user_id: string
        }
        Update: {
          consistency_rank?: number | null
          consistency_rank_delta?: number | null
          consistency_score?: number
          created_at?: string
          details_json?: Json | null
          evolution_rank?: number | null
          evolution_rank_delta?: number | null
          evolution_score?: number
          id?: string
          percentile?: number | null
          performance_rank?: number | null
          performance_rank_delta?: number | null
          performance_score?: number
          practical_rank?: number | null
          practical_rank_delta?: number | null
          practical_score?: number
          snapshot_date?: string
          user_id?: string
        }
        Relationships: []
      }
      real_exam_questions: {
        Row: {
          answer_source: string
          confidence_score: number
          correct_index: number | null
          created_at: string
          difficulty: number
          exam_info: string | null
          explanation: string | null
          id: string
          is_active: boolean
          options: Json
          quality_score: number
          source_url: string
          statement: string
          statement_hash: string
          subtopic: string | null
          topic: string
          updated_at: string
        }
        Insert: {
          answer_source?: string
          confidence_score?: number
          correct_index?: number | null
          created_at?: string
          difficulty?: number
          exam_info?: string | null
          explanation?: string | null
          id?: string
          is_active?: boolean
          options?: Json
          quality_score?: number
          source_url: string
          statement: string
          statement_hash: string
          subtopic?: string | null
          topic: string
          updated_at?: string
        }
        Update: {
          answer_source?: string
          confidence_score?: number
          correct_index?: number | null
          created_at?: string
          difficulty?: number
          exam_info?: string | null
          explanation?: string | null
          id?: string
          is_active?: boolean
          options?: Json
          quality_score?: number
          source_url?: string
          statement?: string
          statement_hash?: string
          subtopic?: string | null
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          created_at: string
          flashcard_id: string
          id: string
          interval_days: number
          next_review: string
          user_id: string
        }
        Insert: {
          created_at?: string
          flashcard_id: string
          id?: string
          interval_days?: number
          next_review?: string
          user_id: string
        }
        Update: {
          created_at?: string
          flashcard_id?: string
          id?: string
          interval_days?: number
          next_review?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
        ]
      }
      revisoes: {
        Row: {
          concluida_em: string | null
          created_at: string
          data_revisao: string
          id: string
          prioridade: number | null
          risco_esquecimento: string | null
          status: string
          tema_id: string
          tipo_revisao: string
          user_id: string
        }
        Insert: {
          concluida_em?: string | null
          created_at?: string
          data_revisao: string
          id?: string
          prioridade?: number | null
          risco_esquecimento?: string | null
          status?: string
          tema_id: string
          tipo_revisao: string
          user_id: string
        }
        Update: {
          concluida_em?: string | null
          created_at?: string
          data_revisao?: string
          id?: string
          prioridade?: number | null
          risco_esquecimento?: string | null
          status?: string
          tema_id?: string
          tipo_revisao?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revisoes_tema_id_fkey"
            columns: ["tema_id"]
            isOneToOne: false
            referencedRelation: "temas_estudados"
            referencedColumns: ["id"]
          },
        ]
      }
      scraping_runs: {
        Row: {
          banca: string | null
          candidate_blocks_found: number
          created_at: string
          duplicates_found: number
          english_leaked: number
          error_message: string | null
          finished_at: string | null
          id: string
          queries_executed: number
          questions_accepted: number
          questions_extracted: number
          questions_rejected: number
          rejection_reasons: Json
          sources_used: Json
          specialty: string
          started_at: string
          status: string
          urls_tested: number
        }
        Insert: {
          banca?: string | null
          candidate_blocks_found?: number
          created_at?: string
          duplicates_found?: number
          english_leaked?: number
          error_message?: string | null
          finished_at?: string | null
          id?: string
          queries_executed?: number
          questions_accepted?: number
          questions_extracted?: number
          questions_rejected?: number
          rejection_reasons?: Json
          sources_used?: Json
          specialty: string
          started_at?: string
          status?: string
          urls_tested?: number
        }
        Update: {
          banca?: string | null
          candidate_blocks_found?: number
          created_at?: string
          duplicates_found?: number
          english_leaked?: number
          error_message?: string | null
          finished_at?: string | null
          id?: string
          queries_executed?: number
          questions_accepted?: number
          questions_extracted?: number
          questions_rejected?: number
          rejection_reasons?: Json
          sources_used?: Json
          specialty?: string
          started_at?: string
          status?: string
          urls_tested?: number
        }
        Relationships: []
      }
      simulation_history: {
        Row: {
          correct_diagnosis: string | null
          created_at: string
          differential_diagnosis: Json | null
          difficulty: string
          evaluation: Json | null
          final_score: number
          grade: string
          id: string
          ideal_approach: string | null
          ideal_prescription: string | null
          improvements: Json | null
          specialty: string
          strengths: Json | null
          student_got_diagnosis: boolean
          time_total_minutes: number
          user_id: string
          xp_earned: number
        }
        Insert: {
          correct_diagnosis?: string | null
          created_at?: string
          differential_diagnosis?: Json | null
          difficulty?: string
          evaluation?: Json | null
          final_score?: number
          grade?: string
          id?: string
          ideal_approach?: string | null
          ideal_prescription?: string | null
          improvements?: Json | null
          specialty: string
          strengths?: Json | null
          student_got_diagnosis?: boolean
          time_total_minutes?: number
          user_id: string
          xp_earned?: number
        }
        Update: {
          correct_diagnosis?: string | null
          created_at?: string
          differential_diagnosis?: Json | null
          difficulty?: string
          evaluation?: Json | null
          final_score?: number
          grade?: string
          id?: string
          ideal_approach?: string | null
          ideal_prescription?: string | null
          improvements?: Json | null
          specialty?: string
          strengths?: Json | null
          student_got_diagnosis?: boolean
          time_total_minutes?: number
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
      simulation_sessions: {
        Row: {
          created_at: string
          difficulty: string
          final_score: number | null
          finished_at: string | null
          id: string
          scenario_id: string | null
          session_data: Json
          session_origin: string
          specialty: string
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          difficulty?: string
          final_score?: number | null
          finished_at?: string | null
          id?: string
          scenario_id?: string | null
          session_data?: Json
          session_origin?: string
          specialty: string
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          difficulty?: string
          final_score?: number | null
          finished_at?: string | null
          id?: string
          scenario_id?: string | null
          session_data?: Json
          session_origin?: string
          specialty?: string
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulation_sessions_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "clinical_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      study_performance: {
        Row: {
          created_at: string
          historico_estudo: Json
          id: string
          pontuacao_discursiva: number | null
          questoes_respondidas: number
          taxa_acerto: number
          tema_atual: string | null
          temas_fracos: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          historico_estudo?: Json
          id?: string
          pontuacao_discursiva?: number | null
          questoes_respondidas?: number
          taxa_acerto?: number
          tema_atual?: string | null
          temas_fracos?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          historico_estudo?: Json
          id?: string
          pontuacao_discursiva?: number | null
          questoes_respondidas?: number
          taxa_acerto?: number
          tema_atual?: string | null
          temas_fracos?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      study_plans: {
        Row: {
          created_at: string
          id: string
          organization_id: string | null
          plan_json: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id?: string | null
          plan_json?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string | null
          plan_json?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      study_tasks: {
        Row: {
          completed: boolean | null
          created_at: string
          id: string
          study_plan_id: string | null
          task_json: Json | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          id?: string
          study_plan_id?: string | null
          task_json?: Json | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          id?: string
          study_plan_id?: string | null
          task_json?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_tasks_study_plan_id_fkey"
            columns: ["study_plan_id"]
            isOneToOne: false
            referencedRelation: "study_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          organization_id: string | null
          plan_id: string | null
          start_date: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          organization_id?: string | null
          plan_id?: string | null
          start_date?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          organization_id?: string | null
          plan_id?: string | null
          start_date?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      summaries: {
        Row: {
          content: string
          created_at: string
          id: string
          organization_id: string | null
          topic: string
          upload_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          organization_id?: string | null
          topic: string
          upload_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          organization_id?: string | null
          topic?: string
          upload_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "summaries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "summaries_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      system_health_logs: {
        Row: {
          active_users: number | null
          ai_ok: boolean
          avg_ai_response_ms: number | null
          checks_json: Json
          created_at: string
          critical_count: number
          id: string
          info_count: number
          metrics_json: Json
          overall_status: string
          run_date: string
          study_engine_ok: boolean
          total_checks: number | null
          warning_count: number
        }
        Insert: {
          active_users?: number | null
          ai_ok?: boolean
          avg_ai_response_ms?: number | null
          checks_json?: Json
          created_at?: string
          critical_count?: number
          id?: string
          info_count?: number
          metrics_json?: Json
          overall_status?: string
          run_date?: string
          study_engine_ok?: boolean
          total_checks?: number | null
          warning_count?: number
        }
        Update: {
          active_users?: number | null
          ai_ok?: boolean
          avg_ai_response_ms?: number | null
          checks_json?: Json
          created_at?: string
          critical_count?: number
          id?: string
          info_count?: number
          metrics_json?: Json
          overall_status?: string
          run_date?: string
          study_engine_ok?: boolean
          total_checks?: number | null
          warning_count?: number
        }
        Relationships: []
      }
      system_health_reports: {
        Row: {
          alerts: Json
          check_date: string
          created_at: string
          id: string
          total_critical: number
          total_info: number
          total_warning: number
        }
        Insert: {
          alerts?: Json
          check_date?: string
          created_at?: string
          id?: string
          total_critical?: number
          total_info?: number
          total_warning?: number
        }
        Update: {
          alerts?: Json
          check_date?: string
          created_at?: string
          id?: string
          total_critical?: number
          total_info?: number
          total_warning?: number
        }
        Relationships: []
      }
      system_metrics: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          metric_type: string
          metric_value: number
          recorded_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_type: string
          metric_value?: number
          recorded_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_type?: string
          metric_value?: number
          recorded_at?: string
        }
        Relationships: []
      }
      teacher_clinical_case_results: {
        Row: {
          case_id: string
          conversation_history: Json | null
          correct_diagnosis: string | null
          created_at: string
          final_evaluation: Json | null
          final_score: number | null
          finished_at: string | null
          grade: string | null
          id: string
          started_at: string | null
          status: string
          student_got_diagnosis: boolean | null
          student_id: string
          time_total_minutes: number | null
          xp_earned: number | null
        }
        Insert: {
          case_id: string
          conversation_history?: Json | null
          correct_diagnosis?: string | null
          created_at?: string
          final_evaluation?: Json | null
          final_score?: number | null
          finished_at?: string | null
          grade?: string | null
          id?: string
          started_at?: string | null
          status?: string
          student_got_diagnosis?: boolean | null
          student_id: string
          time_total_minutes?: number | null
          xp_earned?: number | null
        }
        Update: {
          case_id?: string
          conversation_history?: Json | null
          correct_diagnosis?: string | null
          created_at?: string
          final_evaluation?: Json | null
          final_score?: number | null
          finished_at?: string | null
          grade?: string | null
          id?: string
          started_at?: string | null
          status?: string
          student_got_diagnosis?: boolean | null
          student_id?: string
          time_total_minutes?: number | null
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_clinical_case_results_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "teacher_clinical_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_clinical_cases: {
        Row: {
          case_prompt: Json
          created_at: string
          difficulty: string
          faculdade_filter: string | null
          id: string
          periodo_filter: number | null
          professor_id: string
          specialty: string
          status: string
          time_limit_minutes: number
          title: string
          updated_at: string
        }
        Insert: {
          case_prompt?: Json
          created_at?: string
          difficulty?: string
          faculdade_filter?: string | null
          id?: string
          periodo_filter?: number | null
          professor_id: string
          specialty: string
          status?: string
          time_limit_minutes?: number
          title?: string
          updated_at?: string
        }
        Update: {
          case_prompt?: Json
          created_at?: string
          difficulty?: string
          faculdade_filter?: string | null
          id?: string
          periodo_filter?: number | null
          professor_id?: string
          specialty?: string
          status?: string
          time_limit_minutes?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      teacher_simulado_results: {
        Row: {
          answers_json: Json | null
          created_at: string
          finished_at: string | null
          id: string
          score: number | null
          simulado_id: string
          started_at: string | null
          status: string
          student_id: string
          total_questions: number
        }
        Insert: {
          answers_json?: Json | null
          created_at?: string
          finished_at?: string | null
          id?: string
          score?: number | null
          simulado_id: string
          started_at?: string | null
          status?: string
          student_id: string
          total_questions?: number
        }
        Update: {
          answers_json?: Json | null
          created_at?: string
          finished_at?: string | null
          id?: string
          score?: number | null
          simulado_id?: string
          started_at?: string | null
          status?: string
          student_id?: string
          total_questions?: number
        }
        Relationships: [
          {
            foreignKeyName: "teacher_simulado_results_simulado_id_fkey"
            columns: ["simulado_id"]
            isOneToOne: false
            referencedRelation: "teacher_simulados"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_simulados: {
        Row: {
          auto_assign: boolean | null
          created_at: string
          description: string | null
          faculdade_filter: string | null
          id: string
          periodo_filter: number | null
          professor_id: string
          questions_json: Json
          scheduled_at: string | null
          status: string
          time_limit_minutes: number
          title: string
          topics: string[]
          total_questions: number
          updated_at: string
        }
        Insert: {
          auto_assign?: boolean | null
          created_at?: string
          description?: string | null
          faculdade_filter?: string | null
          id?: string
          periodo_filter?: number | null
          professor_id: string
          questions_json?: Json
          scheduled_at?: string | null
          status?: string
          time_limit_minutes?: number
          title?: string
          topics?: string[]
          total_questions?: number
          updated_at?: string
        }
        Update: {
          auto_assign?: boolean | null
          created_at?: string
          description?: string | null
          faculdade_filter?: string | null
          id?: string
          periodo_filter?: number | null
          professor_id?: string
          questions_json?: Json
          scheduled_at?: string | null
          status?: string
          time_limit_minutes?: number
          title?: string
          topics?: string[]
          total_questions?: number
          updated_at?: string
        }
        Relationships: []
      }
      teacher_study_assignment_results: {
        Row: {
          assignment_id: string
          completed_at: string | null
          created_at: string
          id: string
          questions_generated: boolean | null
          started_at: string | null
          status: string
          student_id: string
        }
        Insert: {
          assignment_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          questions_generated?: boolean | null
          started_at?: string | null
          status?: string
          student_id: string
        }
        Update: {
          assignment_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          questions_generated?: boolean | null
          started_at?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_study_assignment_results_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "teacher_study_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_study_assignments: {
        Row: {
          created_at: string
          faculdade_filter: string | null
          id: string
          material_filename: string | null
          material_url: string | null
          periodo_filter: number | null
          professor_id: string
          specialty: string
          status: string
          title: string
          topics_to_cover: string
        }
        Insert: {
          created_at?: string
          faculdade_filter?: string | null
          id?: string
          material_filename?: string | null
          material_url?: string | null
          periodo_filter?: number | null
          professor_id: string
          specialty: string
          status?: string
          title: string
          topics_to_cover: string
        }
        Update: {
          created_at?: string
          faculdade_filter?: string | null
          id?: string
          material_filename?: string | null
          material_url?: string | null
          periodo_filter?: number | null
          professor_id?: string
          specialty?: string
          status?: string
          title?: string
          topics_to_cover?: string
        }
        Relationships: []
      }
      temas_estudados: {
        Row: {
          anexos: Json | null
          created_at: string
          data_estudo: string
          dificuldade: string | null
          especialidade: string
          fonte: string | null
          id: string
          observacoes: string | null
          status: string | null
          subtopico: string | null
          tema: string
          updated_at: string
          user_id: string
        }
        Insert: {
          anexos?: Json | null
          created_at?: string
          data_estudo?: string
          dificuldade?: string | null
          especialidade: string
          fonte?: string | null
          id?: string
          observacoes?: string | null
          status?: string | null
          subtopico?: string | null
          tema: string
          updated_at?: string
          user_id: string
        }
        Update: {
          anexos?: Json | null
          created_at?: string
          data_estudo?: string
          dificuldade?: string | null
          especialidade?: string
          fonte?: string | null
          id?: string
          observacoes?: string | null
          status?: string | null
          subtopico?: string | null
          tema?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      uploads: {
        Row: {
          category: string | null
          created_at: string
          extracted_json: Json | null
          extracted_text: string | null
          file_type: string | null
          filename: string
          id: string
          is_global: boolean
          organization_id: string | null
          status: string | null
          storage_path: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          extracted_json?: Json | null
          extracted_text?: string | null
          file_type?: string | null
          filename: string
          id?: string
          is_global?: boolean
          organization_id?: string | null
          status?: string | null
          storage_path?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          extracted_json?: Json | null
          extracted_text?: string | null
          file_type?: string | null
          filename?: string
          id?: string
          is_global?: boolean
          organization_id?: string | null
          status?: string | null
          storage_path?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_key: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_key: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_key?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          created_at: string
          feedback_text: string
          id: string
          ratings: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback_text: string
          id?: string
          ratings?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          feedback_text?: string
          id?: string
          ratings?: Json
          user_id?: string
        }
        Relationships: []
      }
      user_gamification: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_activity_date: string | null
          level: number
          longest_streak: number
          updated_at: string
          user_id: string
          weekly_reset_at: string
          weekly_xp: number
          xp: number
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          level?: number
          longest_streak?: number
          updated_at?: string
          user_id: string
          weekly_reset_at?: string
          weekly_xp?: number
          xp?: number
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          level?: number
          longest_streak?: number
          updated_at?: string
          user_id?: string
          weekly_reset_at?: string
          weekly_xp?: number
          xp?: number
        }
        Relationships: []
      }
      user_module_access: {
        Row: {
          created_at: string
          enabled: boolean
          granted_by: string | null
          id: string
          module_key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          granted_by?: string | null
          id?: string
          module_key: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          granted_by?: string | null
          id?: string
          module_key?: string
          user_id?: string
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          current_page: string | null
          last_seen_at: string
          user_id: string
        }
        Insert: {
          current_page?: string | null
          last_seen_at?: string
          user_id: string
        }
        Update: {
          current_page?: string | null
          last_seen_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_quotas: {
        Row: {
          created_at: string
          extra_questions: number
          extra_transcription_minutes: number
          id: string
          questions_limit: number
          questions_used: number
          reset_at: string
          transcription_minutes_limit: number
          transcription_minutes_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          extra_questions?: number
          extra_transcription_minutes?: number
          id?: string
          questions_limit?: number
          questions_used?: number
          reset_at?: string
          transcription_minutes_limit?: number
          transcription_minutes_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          extra_questions?: number
          extra_transcription_minutes?: number
          id?: string
          questions_limit?: number
          questions_used?: number
          reset_at?: string
          transcription_minutes_limit?: number
          transcription_minutes_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_topic_profiles: {
        Row: {
          accuracy: number
          confidence_level: string
          correct_answers: number
          created_at: string
          id: string
          last_practiced_at: string | null
          mastery_level: number
          next_review_at: string | null
          review_interval_days: number
          specialty: string
          topic: string
          total_questions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          accuracy?: number
          confidence_level?: string
          correct_answers?: number
          created_at?: string
          id?: string
          last_practiced_at?: string | null
          mastery_level?: number
          next_review_at?: string | null
          review_interval_days?: number
          specialty?: string
          topic: string
          total_questions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          accuracy?: number
          confidence_level?: string
          correct_answers?: number
          created_at?: string
          id?: string
          last_practiced_at?: string | null
          mastery_level?: number
          next_review_at?: string | null
          review_interval_days?: number
          specialty?: string
          topic?: string
          total_questions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      video_rooms: {
        Row: {
          created_at: string
          ended_at: string | null
          faculdade_filter: string | null
          id: string
          invited_students: Json
          meet_link: string | null
          periodo_filter: number | null
          professor_id: string
          room_code: string
          status: string
          telegram_chat_id: string | null
          telegram_group_link: string | null
          title: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          faculdade_filter?: string | null
          id?: string
          invited_students?: Json
          meet_link?: string | null
          periodo_filter?: number | null
          professor_id: string
          room_code: string
          status?: string
          telegram_chat_id?: string | null
          telegram_group_link?: string | null
          title?: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          faculdade_filter?: string | null
          id?: string
          invited_students?: Json
          meet_link?: string | null
          periodo_filter?: number | null
          professor_id?: string
          room_code?: string
          status?: string
          telegram_chat_id?: string | null
          telegram_group_link?: string | null
          title?: string
        }
        Relationships: []
      }
      whatsapp_execution_logs: {
        Row: {
          action: string
          created_at: string
          execution_id: string
          id: string
          message: string | null
          metadata_json: Json | null
          queue_item_id: string | null
          status: string
        }
        Insert: {
          action: string
          created_at?: string
          execution_id: string
          id?: string
          message?: string | null
          metadata_json?: Json | null
          queue_item_id?: string | null
          status: string
        }
        Update: {
          action?: string
          created_at?: string
          execution_id?: string
          id?: string
          message?: string | null
          metadata_json?: Json | null
          queue_item_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_execution_logs_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_send_executions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_execution_logs_queue_item_id_fkey"
            columns: ["queue_item_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_message_log"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_message_log: {
        Row: {
          admin_user_id: string
          attempts: number
          created_at: string
          delivery_status: string
          error_message: string | null
          execution_id: string | null
          execution_mode: string
          id: string
          message_text: string
          sent_at: string
          target_user_id: string
          updated_at: string
        }
        Insert: {
          admin_user_id: string
          attempts?: number
          created_at?: string
          delivery_status?: string
          error_message?: string | null
          execution_id?: string | null
          execution_mode?: string
          id?: string
          message_text: string
          sent_at?: string
          target_user_id: string
          updated_at?: string
        }
        Update: {
          admin_user_id?: string
          attempts?: number
          created_at?: string
          delivery_status?: string
          error_message?: string | null
          execution_id?: string | null
          execution_mode?: string
          id?: string
          message_text?: string
          sent_at?: string
          target_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_message_log_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_send_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_send_executions: {
        Row: {
          admin_user_id: string
          created_at: string
          execution_date: string
          finished_at: string | null
          id: string
          mode: string
          started_at: string | null
          status: string
          total_error: number
          total_items: number
          total_sent: number
          total_skipped: number
          updated_at: string
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          execution_date?: string
          finished_at?: string | null
          id?: string
          mode?: string
          started_at?: string | null
          status?: string
          total_error?: number
          total_items?: number
          total_sent?: number
          total_skipped?: number
          updated_at?: string
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          execution_date?: string
          finished_at?: string | null
          id?: string
          mode?: string
          started_at?: string | null
          status?: string
          total_error?: number
          total_items?: number
          total_sent?: number
          total_skipped?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_login_stats: {
        Args: never
        Returns: {
          alunos: number
          flashcards: number
          questoes: number
        }[]
      }
      get_login_testimonials: {
        Args: never
        Returns: {
          avg_rating: number
          display_name: string
          feedback_text: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      professor_owns_clinical_case: {
        Args: { _case_id: string; _user_id: string }
        Returns: boolean
      }
      student_has_clinical_case_result: {
        Args: { _case_id: string; _user_id: string }
        Returns: boolean
      }
      student_has_simulado_result: {
        Args: { _simulado_id: string; _user_id: string }
        Returns: boolean
      }
      student_has_study_assignment_result: {
        Args: { _assignment_id: string; _user_id: string }
        Returns: boolean
      }
      user_institution_id: { Args: { _user_id: string }; Returns: string }
      user_is_institution_staff: {
        Args: { _user_id: string }
        Returns: boolean
      }
      users_share_institution: {
        Args: { _target_user_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "user"
        | "professor"
        | "coordinator"
        | "institutional_admin"
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
      app_role: [
        "admin",
        "user",
        "professor",
        "coordinator",
        "institutional_admin",
      ],
    },
  },
} as const
