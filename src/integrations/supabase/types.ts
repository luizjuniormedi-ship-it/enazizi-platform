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
          faculdade: string | null
          has_completed_diagnostic: boolean | null
          id: string
          is_blocked: boolean
          organization_id: string | null
          periodo: number | null
          phone: string | null
          status: string
          target_specialty: string | null
          updated_at: string
          user_id: string
          user_type: string
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
          faculdade?: string | null
          has_completed_diagnostic?: boolean | null
          id?: string
          is_blocked?: boolean
          organization_id?: string | null
          periodo?: number | null
          phone?: string | null
          status?: string
          target_specialty?: string | null
          updated_at?: string
          user_id: string
          user_type?: string
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
          faculdade?: string | null
          has_completed_diagnostic?: boolean | null
          id?: string
          is_blocked?: boolean
          organization_id?: string | null
          periodo?: number | null
          phone?: string | null
          status?: string
          target_specialty?: string | null
          updated_at?: string
          user_id?: string
          user_type?: string
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
      questions_bank: {
        Row: {
          correct_index: number | null
          created_at: string
          difficulty: number | null
          explanation: string | null
          id: string
          is_global: boolean | null
          options: Json | null
          organization_id: string | null
          original_question_id: string | null
          review_status: string | null
          source: string | null
          statement: string
          topic: string | null
          user_id: string
        }
        Insert: {
          correct_index?: number | null
          created_at?: string
          difficulty?: number | null
          explanation?: string | null
          id?: string
          is_global?: boolean | null
          options?: Json | null
          organization_id?: string | null
          original_question_id?: string | null
          review_status?: string | null
          source?: string | null
          statement: string
          topic?: string | null
          user_id: string
        }
        Update: {
          correct_index?: number | null
          created_at?: string
          difficulty?: number | null
          explanation?: string | null
          id?: string
          is_global?: boolean | null
          options?: Json | null
          organization_id?: string | null
          original_question_id?: string | null
          review_status?: string | null
          source?: string | null
          statement?: string
          topic?: string | null
          user_id?: string
        }
        Relationships: [
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
          created_at: string
          description: string | null
          faculdade_filter: string | null
          id: string
          periodo_filter: number | null
          professor_id: string
          questions_json: Json
          status: string
          time_limit_minutes: number
          title: string
          topics: string[]
          total_questions: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          faculdade_filter?: string | null
          id?: string
          periodo_filter?: number | null
          professor_id: string
          questions_json?: Json
          status?: string
          time_limit_minutes?: number
          title?: string
          topics?: string[]
          total_questions?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          faculdade_filter?: string | null
          id?: string
          periodo_filter?: number | null
          professor_id?: string
          questions_json?: Json
          status?: string
          time_limit_minutes?: number
          title?: string
          topics?: string[]
          total_questions?: number
          updated_at?: string
        }
        Relationships: []
      }
      temas_estudados: {
        Row: {
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
      whatsapp_message_log: {
        Row: {
          admin_user_id: string
          created_at: string
          id: string
          message_text: string
          sent_at: string
          target_user_id: string
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          id?: string
          message_text: string
          sent_at?: string
          target_user_id: string
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          id?: string
          message_text?: string
          sent_at?: string
          target_user_id?: string
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
    }
    Enums: {
      app_role: "admin" | "user" | "professor"
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
      app_role: ["admin", "user", "professor"],
    },
  },
} as const
