export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      expert_critique: {
        Row: {
          critique_text: string | null
          model_output_id: number | null
          pass: boolean | null
        }
        Insert: {
          critique_text?: string | null
          model_output_id?: number | null
          pass?: boolean | null
        }
        Update: {
          critique_text?: string | null
          model_output_id?: number | null
          pass?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "expert_critique_model_output_id_fkey"
            columns: ["model_output_id"]
            isOneToOne: false
            referencedRelation: "model_output"
            referencedColumns: ["id"]
          },
        ]
      }
      judge_critique: {
        Row: {
          critique_text: string | null
          model_output_id: number | null
          pass: boolean | null
        }
        Insert: {
          critique_text?: string | null
          model_output_id?: number | null
          pass?: boolean | null
        }
        Update: {
          critique_text?: string | null
          model_output_id?: number | null
          pass?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "judge_critique_model_output_id_fkey"
            columns: ["model_output_id"]
            isOneToOne: false
            referencedRelation: "model_output"
            referencedColumns: ["id"]
          },
        ]
      }
      model: {
        Row: {
          id: number
          project_id: number | null
          score: number | null
          version_number: string | null
        }
        Insert: {
          id?: never
          project_id?: number | null
          score?: number | null
          version_number?: string | null
        }
        Update: {
          id?: never
          project_id?: number | null
          score?: number | null
          version_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "model_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
      }
      model_output: {
        Row: {
          data: string | null
          id: number
          model_id: number | null
          project_id: number | null
          synthetic_data_id: number | null
        }
        Insert: {
          data?: string | null
          id?: never
          model_id?: number | null
          project_id?: number | null
          synthetic_data_id?: number | null
        }
        Update: {
          data?: string | null
          id?: never
          model_id?: number | null
          project_id?: number | null
          synthetic_data_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "model_output_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "model"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_output_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_output_synthetic_data_id_fkey"
            columns: ["synthetic_data_id"]
            isOneToOne: false
            referencedRelation: "synthetic_data"
            referencedColumns: ["id"]
          },
        ]
      }
      project: {
        Row: {
          id: number
          judge_prompt: string | null
          model_input_dimensions: Json | null
          model_summary: string | null
          name: string | null
        }
        Insert: {
          id?: never
          judge_prompt?: string | null
          model_input_dimensions?: Json | null
          model_summary?: string | null
          name?: string | null
        }
        Update: {
          id?: never
          judge_prompt?: string | null
          model_input_dimensions?: Json | null
          model_summary?: string | null
          name?: string | null
        }
        Relationships: []
      }
      synthetic_data: {
        Row: {
          data: string | null
          id: number
          project_id: number | null
        }
        Insert: {
          data?: string | null
          id?: never
          project_id?: number | null
        }
        Update: {
          data?: string | null
          id?: never
          project_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "synthetic_data_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
