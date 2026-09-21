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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      actividades: {
        Row: {
          contacto_id: string | null
          creado_en: string
          descripcion: string | null
          fecha: string
          id: string
          inmueble_id: string | null
          oportunidad_id: string | null
          tipo: Database["public"]["Enums"]["tipo_actividad"]
          titulo: string
          usuario_id: string
        }
        Insert: {
          contacto_id?: string | null
          creado_en?: string
          descripcion?: string | null
          fecha?: string
          id?: string
          inmueble_id?: string | null
          oportunidad_id?: string | null
          tipo: Database["public"]["Enums"]["tipo_actividad"]
          titulo: string
          usuario_id: string
        }
        Update: {
          contacto_id?: string | null
          creado_en?: string
          descripcion?: string | null
          fecha?: string
          id?: string
          inmueble_id?: string | null
          oportunidad_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_actividad"]
          titulo?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "actividades_contacto_id_fkey"
            columns: ["contacto_id"]
            isOneToOne: false
            referencedRelation: "contactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actividades_inmueble_id_fkey"
            columns: ["inmueble_id"]
            isOneToOne: false
            referencedRelation: "inmuebles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actividades_oportunidad_id_fkey"
            columns: ["oportunidad_id"]
            isOneToOne: false
            referencedRelation: "oportunidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actividades_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      contactos: {
        Row: {
          activo: boolean
          actualizado_en: string
          actualizado_por: string | null
          apellido: string
          creado_en: string
          creado_por: string | null
          email: string | null
          es_interesado: boolean
          es_propietario: boolean
          estado: Database["public"]["Enums"]["estado_contacto"]
          id: string
          nombre: string
          observaciones: string | null
          sucursal_id: string | null
          telefono: string | null
        }
        Insert: {
          activo?: boolean
          actualizado_en?: string
          actualizado_por?: string | null
          apellido: string
          creado_en?: string
          creado_por?: string | null
          email?: string | null
          es_interesado?: boolean
          es_propietario?: boolean
          estado?: Database["public"]["Enums"]["estado_contacto"]
          id?: string
          nombre: string
          observaciones?: string | null
          sucursal_id?: string | null
          telefono?: string | null
        }
        Update: {
          activo?: boolean
          actualizado_en?: string
          actualizado_por?: string | null
          apellido?: string
          creado_en?: string
          creado_por?: string | null
          email?: string | null
          es_interesado?: boolean
          es_propietario?: boolean
          estado?: Database["public"]["Enums"]["estado_contacto"]
          id?: string
          nombre?: string
          observaciones?: string | null
          sucursal_id?: string | null
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contactos_actualizado_por_fkey"
            columns: ["actualizado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contactos_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contactos_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
        ]
      }
      etapas: {
        Row: {
          activo: boolean
          creado_en: string
          descripcion: string | null
          es_final: boolean
          funnel_id: string
          id: string
          nombre: string
          orden: number
          resultado: Database["public"]["Enums"]["estado_oportunidad"]
        }
        Insert: {
          activo?: boolean
          creado_en?: string
          descripcion?: string | null
          es_final?: boolean
          funnel_id: string
          id?: string
          nombre: string
          orden: number
          resultado?: Database["public"]["Enums"]["estado_oportunidad"]
        }
        Update: {
          activo?: boolean
          creado_en?: string
          descripcion?: string | null
          es_final?: boolean
          funnel_id?: string
          id?: string
          nombre?: string
          orden?: number
          resultado?: Database["public"]["Enums"]["estado_oportunidad"]
        }
        Relationships: [
          {
            foreignKeyName: "etapas_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      funnels: {
        Row: {
          activo: boolean
          creado_en: string
          id: string
          nombre: string
          tipo: Database["public"]["Enums"]["tipo_funnel"]
        }
        Insert: {
          activo?: boolean
          creado_en?: string
          id?: string
          nombre: string
          tipo: Database["public"]["Enums"]["tipo_funnel"]
        }
        Update: {
          activo?: boolean
          creado_en?: string
          id?: string
          nombre?: string
          tipo?: Database["public"]["Enums"]["tipo_funnel"]
        }
        Relationships: []
      }
      historial_etapas: {
        Row: {
          creado_en: string
          etapa_anterior_id: string | null
          etapa_nueva_id: string
          id: string
          observacion: string | null
          oportunidad_id: string
          usuario_id: string | null
        }
        Insert: {
          creado_en?: string
          etapa_anterior_id?: string | null
          etapa_nueva_id: string
          id?: string
          observacion?: string | null
          oportunidad_id: string
          usuario_id?: string | null
        }
        Update: {
          creado_en?: string
          etapa_anterior_id?: string | null
          etapa_nueva_id?: string
          id?: string
          observacion?: string | null
          oportunidad_id?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historial_etapas_etapa_anterior_id_fkey"
            columns: ["etapa_anterior_id"]
            isOneToOne: false
            referencedRelation: "etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historial_etapas_etapa_nueva_id_fkey"
            columns: ["etapa_nueva_id"]
            isOneToOne: false
            referencedRelation: "etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historial_etapas_oportunidad_id_fkey"
            columns: ["oportunidad_id"]
            isOneToOne: false
            referencedRelation: "oportunidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historial_etapas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      inmobiliarias: {
        Row: {
          activo: boolean
          actualizado_en: string
          creado_en: string
          cuit: string | null
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          actualizado_en?: string
          creado_en?: string
          cuit?: string | null
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          actualizado_en?: string
          creado_en?: string
          cuit?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      inmuebles: {
        Row: {
          activo: boolean
          actualizado_en: string
          actualizado_por: string | null
          ambientes: number | null
          contacto_id: string
          creado_en: string
          creado_por: string | null
          direccion: string
          estado: Database["public"]["Enums"]["estado_inmueble"]
          expensas: number | null
          id: string
          m2: number | null
          moneda: Database["public"]["Enums"]["moneda"]
          nombre: string | null
          precio: number | null
          sucursal_id: string | null
          tipo_inmueble: Database["public"]["Enums"]["tipo_inmueble"]
          tipo_operacion: Database["public"]["Enums"]["tipo_operacion"]
        }
        Insert: {
          activo?: boolean
          actualizado_en?: string
          actualizado_por?: string | null
          ambientes?: number | null
          contacto_id: string
          creado_en?: string
          creado_por?: string | null
          direccion: string
          estado?: Database["public"]["Enums"]["estado_inmueble"]
          expensas?: number | null
          id?: string
          m2?: number | null
          moneda?: Database["public"]["Enums"]["moneda"]
          nombre?: string | null
          precio?: number | null
          sucursal_id?: string | null
          tipo_inmueble?: Database["public"]["Enums"]["tipo_inmueble"]
          tipo_operacion: Database["public"]["Enums"]["tipo_operacion"]
        }
        Update: {
          activo?: boolean
          actualizado_en?: string
          actualizado_por?: string | null
          ambientes?: number | null
          contacto_id?: string
          creado_en?: string
          creado_por?: string | null
          direccion?: string
          estado?: Database["public"]["Enums"]["estado_inmueble"]
          expensas?: number | null
          id?: string
          m2?: number | null
          moneda?: Database["public"]["Enums"]["moneda"]
          nombre?: string | null
          precio?: number | null
          sucursal_id?: string | null
          tipo_inmueble?: Database["public"]["Enums"]["tipo_inmueble"]
          tipo_operacion?: Database["public"]["Enums"]["tipo_operacion"]
        }
        Relationships: [
          {
            foreignKeyName: "inmuebles_actualizado_por_fkey"
            columns: ["actualizado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inmuebles_contacto_id_fkey"
            columns: ["contacto_id"]
            isOneToOne: false
            referencedRelation: "contactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inmuebles_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inmuebles_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
        ]
      }
      motivos_perdida: {
        Row: {
          activo: boolean
          creado_en: string
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          creado_en?: string
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          creado_en?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      oportunidades: {
        Row: {
          activo: boolean
          actualizado_en: string
          actualizado_por: string | null
          contacto_id: string
          creado_en: string
          creado_por: string | null
          estado: Database["public"]["Enums"]["estado_oportunidad"]
          etapa_id: string
          fecha_cierre_estimada: string | null
          fecha_cierre_real: string | null
          funnel_id: string
          id: string
          inmueble_id: string | null
          moneda: Database["public"]["Enums"]["moneda"]
          motivo_perdida_id: string | null
          observaciones: string | null
          origen_id: string | null
          responsable_id: string
          titulo: string
          valor_estimado: number | null
          valor_final: number | null
        }
        Insert: {
          activo?: boolean
          actualizado_en?: string
          actualizado_por?: string | null
          contacto_id: string
          creado_en?: string
          creado_por?: string | null
          estado?: Database["public"]["Enums"]["estado_oportunidad"]
          etapa_id: string
          fecha_cierre_estimada?: string | null
          fecha_cierre_real?: string | null
          funnel_id: string
          id?: string
          inmueble_id?: string | null
          moneda?: Database["public"]["Enums"]["moneda"]
          motivo_perdida_id?: string | null
          observaciones?: string | null
          origen_id?: string | null
          responsable_id: string
          titulo: string
          valor_estimado?: number | null
          valor_final?: number | null
        }
        Update: {
          activo?: boolean
          actualizado_en?: string
          actualizado_por?: string | null
          contacto_id?: string
          creado_en?: string
          creado_por?: string | null
          estado?: Database["public"]["Enums"]["estado_oportunidad"]
          etapa_id?: string
          fecha_cierre_estimada?: string | null
          fecha_cierre_real?: string | null
          funnel_id?: string
          id?: string
          inmueble_id?: string | null
          moneda?: Database["public"]["Enums"]["moneda"]
          motivo_perdida_id?: string | null
          observaciones?: string | null
          origen_id?: string | null
          responsable_id?: string
          titulo?: string
          valor_estimado?: number | null
          valor_final?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "oportunidades_actualizado_por_fkey"
            columns: ["actualizado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_contacto_id_fkey"
            columns: ["contacto_id"]
            isOneToOne: false
            referencedRelation: "contactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_inmueble_id_fkey"
            columns: ["inmueble_id"]
            isOneToOne: false
            referencedRelation: "inmuebles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_motivo_perdida_id_fkey"
            columns: ["motivo_perdida_id"]
            isOneToOne: false
            referencedRelation: "motivos_perdida"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_origen_id_fkey"
            columns: ["origen_id"]
            isOneToOne: false
            referencedRelation: "origenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      origenes: {
        Row: {
          activo: boolean
          creado_en: string
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          creado_en?: string
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          creado_en?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      sucursales: {
        Row: {
          activo: boolean
          actualizado_en: string
          creado_en: string
          direccion: string | null
          id: string
          inmobiliaria_id: string
          nombre: string
          telefono: string | null
        }
        Insert: {
          activo?: boolean
          actualizado_en?: string
          creado_en?: string
          direccion?: string | null
          id?: string
          inmobiliaria_id: string
          nombre: string
          telefono?: string | null
        }
        Update: {
          activo?: boolean
          actualizado_en?: string
          creado_en?: string
          direccion?: string | null
          id?: string
          inmobiliaria_id?: string
          nombre?: string
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sucursales_inmobiliaria_id_fkey"
            columns: ["inmobiliaria_id"]
            isOneToOne: false
            referencedRelation: "inmobiliarias"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          activo: boolean
          actualizado_en: string
          apellido: string
          creado_en: string
          email: string
          id: string
          nombre: string
          rol: Database["public"]["Enums"]["rol_usuario"]
          sucursal_id: string | null
        }
        Insert: {
          activo?: boolean
          actualizado_en?: string
          apellido?: string
          creado_en?: string
          email: string
          id: string
          nombre?: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
          sucursal_id?: string | null
        }
        Update: {
          activo?: boolean
          actualizado_en?: string
          apellido?: string
          creado_en?: string
          email?: string
          id?: string
          nombre?: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
          sucursal_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      es_admin: { Args: never; Returns: boolean }
      es_usuario_activo: { Args: never; Returns: boolean }
      rol_actual: {
        Args: never
        Returns: Database["public"]["Enums"]["rol_usuario"]
      }
      ve_todo: { Args: never; Returns: boolean }
    }
    Enums: {
      estado_contacto: "POTENCIAL" | "CLIENTE" | "INACTIVO" | "NO_CONTACTAR"
      estado_inmueble: "DISPONIBLE" | "RESERVADO" | "OPERADO" | "RETIRADO"
      estado_oportunidad: "ABIERTA" | "GANADA" | "PERDIDA"
      moneda: "ARS" | "USD"
      rol_usuario: "ADMINISTRADOR" | "VENDEDOR" | "RESPONSABLE_COMERCIAL"
      tipo_actividad:
        | "LLAMADA"
        | "VISITA"
        | "MENSAJE"
        | "EMAIL"
        | "REUNION"
        | "TASACION"
      tipo_funnel:
        | "CAPTACION_VENTA"
        | "CAPTACION_ALQUILER"
        | "INTERESADOS_COMPRA"
        | "INTERESADOS_ALQUILER"
      tipo_inmueble: "CASA" | "DEPARTAMENTO" | "PH"
      tipo_operacion: "VENTA" | "ALQUILER"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      estado_contacto: ["POTENCIAL", "CLIENTE", "INACTIVO", "NO_CONTACTAR"],
      estado_inmueble: ["DISPONIBLE", "RESERVADO", "OPERADO", "RETIRADO"],
      estado_oportunidad: ["ABIERTA", "GANADA", "PERDIDA"],
      moneda: ["ARS", "USD"],
      rol_usuario: ["ADMINISTRADOR", "VENDEDOR", "RESPONSABLE_COMERCIAL"],
      tipo_actividad: [
        "LLAMADA",
        "VISITA",
        "MENSAJE",
        "EMAIL",
        "REUNION",
        "TASACION",
      ],
      tipo_funnel: [
        "CAPTACION_VENTA",
        "CAPTACION_ALQUILER",
        "INTERESADOS_COMPRA",
        "INTERESADOS_ALQUILER",
      ],
      tipo_inmueble: ["CASA", "DEPARTAMENTO", "PH"],
      tipo_operacion: ["VENTA", "ALQUILER"],
    },
  },
} as const
