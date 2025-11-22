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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      Answers: {
        Row: {
          choice: boolean
          created_at: string
          embedding: string | null
          id: number
          opinion_id: number
          text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          choice: boolean
          created_at?: string
          embedding?: string | null
          id?: number
          opinion_id: number
          text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          choice?: boolean
          created_at?: string
          embedding?: string | null
          id?: number
          opinion_id?: number
          text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "Answers_opinion_id_fkey"
            columns: ["opinion_id"]
            isOneToOne: false
            referencedRelation: "Opinions"
            referencedColumns: ["id"]
          },
        ]
      }
      Candidates: {
        Row: {
          age: number | null
          created_at: string
          id: number
          image: string | null
          name: string | null
          political_party: string | null
          updated_at: string
        }
        Insert: {
          age?: number | null
          created_at?: string
          id?: number
          image?: string | null
          name?: string | null
          political_party?: string | null
          updated_at?: string
        }
        Update: {
          age?: number | null
          created_at?: string
          id?: number
          image?: string | null
          name?: string | null
          political_party?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      Conversations: {
        Row: {
          candidate_id: number
          created_at: string
          id: number
          status: string
          updated_at: string
        }
        Insert: {
          candidate_id: number
          created_at?: string
          id?: number
          status: string
          updated_at?: string
        }
        Update: {
          candidate_id?: number
          created_at?: string
          id?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "Conversations_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "Candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      Messages: {
        Row: {
          conversation_id: number
          created_at: string
          id: number
          role: string
          text: string | null
          updated_at: string
        }
        Insert: {
          conversation_id: number
          created_at?: string
          id?: number
          role: string
          text?: string | null
          updated_at?: string
        }
        Update: {
          conversation_id?: number
          created_at?: string
          id?: number
          role?: string
          text?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "Messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "Conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      Opinions: {
        Row: {
          candidate_id: number
          created_at: string
          embedding: string | null
          id: number
          text: string | null
          topic_id: number
          updated_at: string
        }
        Insert: {
          candidate_id: number
          created_at?: string
          embedding?: string | null
          id?: number
          text?: string | null
          topic_id: number
          updated_at?: string
        }
        Update: {
          candidate_id?: number
          created_at?: string
          embedding?: string | null
          id?: number
          text?: string | null
          topic_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "Opinions_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "Candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Opinions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "Topics"
            referencedColumns: ["id"]
          },
        ]
      }
      Topics: {
        Row: {
          created_at: string
          emoji: string | null
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          id?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          emoji?: string | null
          id?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      UserTopics: {
        Row: {
          created_at: string
          id: number
          topic_id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          topic_id: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          topic_id?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "UserTopics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "Topics"
            referencedColumns: ["id"]
          },
        ]
      }
      UserMatches: {
        Row: {
          created_at: string
          id: number
          candidate_id: number
          updated_at: string
          user_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: number
          candidate_id: number
          updated_at?: string
          user_id: string
          status: string
        }
        Update: {
          created_at?: string
          id?: number
          candidate_id?: number
          updated_at?: string
          user_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "UserMatches_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "Candidates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_or_create_answer_embedding: {
        Args: { answer_text_param: string; embedding_param: string }
        Returns: string
      }
      match_candidates_by_topic: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
          topic_ids: number[]
        }
        Returns: {
          avg_similarity: number
          candidate_id: number
          candidate_name: string
          candidate_party: string
          opinion_count: number
        }[]
      }
      match_documents_by_candidate: {
        Args: {
          candidate_filter_id: number
          match_count?: number
          query_embedding: string
        }
        Returns: {
          candidate_id: number
          distance: number
          id: number
          text: string
        }[]
      }
      match_opinions: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
          topic_ids?: number[]
        }
        Returns: {
          candidate_id: number
          id: number
          similarity: number
          text: string
          topic_id: number
        }[]
      }
      recalculate_embedding_for_opinion: {
        Args: { opinion_id_param: number }
        Returns: boolean
      }
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
