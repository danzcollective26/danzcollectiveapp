// Generated from Supabase schema on 2026-11-09; contains no records or credentials.
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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      danz_yeppo_feedback: {
        Row: { id: string; user_id: string; category: string; section: string; message: string; status: string; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; category: string; section: string; message: string; status?: string; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; category?: string; section?: string; message?: string; status?: string; created_at?: string; updated_at?: string }
        Relationships: []
      }
      danz_admin_permissions: {
        Row: { user_id: string; permission: string }
        Insert: { user_id: string; permission: string }
        Update: { user_id?: string; permission?: string }
        Relationships: [{ foreignKeyName: 'danz_admin_permissions_user_id_fkey'; columns: ['user_id']; isOneToOne: false; referencedRelation: 'danz_admins'; referencedColumns: ['user_id'] }]
      }
      danz_admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      danz_attendance: {
        Row: {
          event_id: string
          granted_at: string
          user_id: string
        }
        Insert: {
          event_id: string
          granted_at?: string
          user_id: string
        }
        Update: {
          event_id?: string
          granted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "danz_attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "danz_events"
            referencedColumns: ["id"]
          },
        ]
      }
      danz_event_access_codes: {
        Row: {
          code_hash: string
          created_at: string
          event_id: string
          expires_at: string | null
          id: string
          max_uses: number | null
          revoked_at: string | null
          used_count: number
        }
        Insert: {
          code_hash: string
          created_at?: string
          event_id: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          revoked_at?: string | null
          used_count?: number
        }
        Update: {
          code_hash?: string
          created_at?: string
          event_id?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          revoked_at?: string | null
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "danz_event_access_codes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "danz_events"
            referencedColumns: ["id"]
          },
        ]
      }
      danz_events: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          starts_at: string | null
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          starts_at?: string | null
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          starts_at?: string | null
          status?: string
          title?: string
        }
        Relationships: []
      }
      danz_photo_reports: {
        Row: {
          created_at: string
          id: string
          photo_id: string
          reason: string
          reporter_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          photo_id: string
          reason: string
          reporter_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          photo_id?: string
          reason?: string
          reporter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "danz_photo_reports_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "danz_photos"
            referencedColumns: ["id"]
          },
        ]
      }
      danz_photos: {
        Row: {
          preview_path: string | null
          original_name: string | null
          original_bytes: number
          preview_bytes: number
          mime_type: string | null
          sha256: string | null
          upload_ready: boolean
          created_at: string
          event_id: string
          id: string
          status: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          status?: string
          storage_path: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          status?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "danz_photos_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "danz_events"
            referencedColumns: ["id"]
          },
        ]
      }
      danz_membership_numbers: {
        Row: { user_id: string; member_number: number; assigned_at: string }
        Insert: { user_id: string; member_number?: number; assigned_at?: string }
        Update: { user_id?: string; member_number?: number; assigned_at?: string }
        Relationships: []
      }
      danz_profiles: {
        Row: {
          created_at: string
          display_name: string | null
          instagram_handle: string | null
          yeppo_enabled: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          instagram_handle?: string | null
          yeppo_enabled?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          instagram_handle?: string | null
          yeppo_enabled?: boolean
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      danz_identity_status: { Args:Record<string,never>; Returns:Json }
      danz_instagram_request: { Args:{p_handle:string}; Returns:Json }
      danz_instagram_admin: { Args:Record<string,never>; Returns:Json }
      danz_instagram_review: { Args:{p_user:string;p_code:string;p_approve:boolean}; Returns:undefined }
      danz_snake_start: { Args: {p_id:string;p_mode:string;p_alias:string}; Returns:Json }
      danz_snake_submit: { Args: {p_id:string;p_moves:string}; Returns:Json }
      danz_snake_board: { Args: {p_mode:string;p_period:string}; Returns:Json }
      danz_points_summary: { Args: Record<string, never>; Returns: Json }
      danz_points_suggest: { Args: { p_id: string; p_kind: string; p_body: string }; Returns: string }
      danz_points_purchase: { Args: { p_event_id: string; p_code: string; p_reference: string; p_amount_cents: number }; Returns: string }
      danz_points_admin: { Args: { p_event_id: string }; Returns: Json }
      danz_points_void: { Args: { p_id: string }; Returns: undefined }
      danz_gallery_usage: { Args: Record<string, never>; Returns: { used_bytes: number; limit_bytes: number; photo_count: number }[] }
      danz_prepare_photo: { Args: { p_event_id: string; p_id: string; p_name: string; p_size: number; p_preview_size: number; p_mime: string; p_sha256: string }; Returns: PhotoReservation[] }
      danz_finish_photo: { Args: { p_id: string }; Returns: undefined }
      danz_admin_photos: { Args: { p_event_id: string; p_offset: number }; Returns: AdminPhoto[] }
      danz_photo_state: { Args: { p_event_id: string; p_ids: string[]; p_status: string }; Returns: number }
      danz_admin_context: { Args: Record<string, never>; Returns: { is_admin: boolean; permissions: string[] }[] }
      danz_admin_events: { Args: Record<string, never>; Returns: AdminEvent[] }
      danz_admin_save_event: { Args: { p_id: string; p_title: string; p_starts_at: string | null; p_ends_at: string | null; p_status: string }; Returns: AdminEvent[] }
      danz_admin_codes: { Args: { p_event_id: string }; Returns: AdminCode[] }
      danz_admin_issue_code: { Args: { p_event_id: string; p_id: string; p_code_hash: string; p_expires_at: string; p_max_uses: number | null }; Returns: AdminCode[] }
      danz_admin_revoke_code: { Args: { p_id: string }; Returns: AdminCode[] }
      danz_redeem_event_code: {
        Args: { p_code: string }
        Returns: { status: string; event_id: string | null; granted_at: string | null }[]
      }
      danz_my_passport: {
        Args: Record<string, never>
        Returns: { event_id: string; title: string; starts_at: string | null; event_status: string; granted_at: string }[]
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
export type AdminEvent = { id: string; title: string; starts_at: string | null; ends_at: string | null; status: string }
export type AdminCode = { id: string; event_id: string; expires_at: string | null; max_uses: number | null; used_count: number; revoked_at: string | null; created_at: string }
export type AdminPhoto = Database['public']['Tables']['danz_photos']['Row']
export type PhotoReservation = { id: string; storage_path: string; preview_path: string; upload_ready: boolean; original_exists: boolean; preview_exists: boolean }

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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

