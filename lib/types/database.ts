export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          status: ProjectStatus;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          description?: string;
          status?: ProjectStatus;
          user_id: string;
        };
        Update: {
          name?: string;
          description?: string;
          status?: ProjectStatus;
        };
      };
      areas: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          color: string | null;
          project_id: string;
          created_at: string;
        };
        Insert: {
          name: string;
          description?: string;
          color?: string;
          project_id: string;
        };
        Update: {
          name?: string;
          description?: string;
          color?: string;
        };
      };
      transcriptions: {
        Row: {
          id: string;
          title: string;
          file_path: string;
          file_name: string;
          file_size: number | null;
          content: string | null;
          project_id: string;
          uploaded_at: string;
        };
        Insert: {
          title: string;
          file_path: string;
          file_name: string;
          file_size?: number;
          content?: string;
          project_id: string;
        };
        Update: {
          title?: string;
          content?: string;
        };
      };
      transcription_areas: {
        Row: {
          transcription_id: string;
          area_id: string;
        };
        Insert: {
          transcription_id: string;
          area_id: string;
        };
        Update: never;
      };
      notes: {
        Row: {
          id: string;
          title: string;
          content: string;
          ai_generated: boolean;
          validated: boolean;
          area_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          title: string;
          content: string;
          ai_generated?: boolean;
          validated?: boolean;
          area_id: string;
        };
        Update: {
          title?: string;
          content?: string;
          validated?: boolean;
        };
      };
      diagnosis: {
        Row: {
          id: string;
          current_situation: string;
          conclusions: string;
          application_inventory: string;
          application_map: string;
          validated: boolean;
          project_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          current_situation: string;
          conclusions: string;
          application_inventory: string;
          application_map: string;
          validated?: boolean;
          project_id: string;
        };
        Update: {
          current_situation?: string;
          conclusions?: string;
          application_inventory?: string;
          application_map?: string;
          validated?: boolean;
        };
      };
      project_ideas: {
        Row: {
          id: string;
          title: string;
          description: string;
          justification: string;
          status: ProjectIdeaStatus;
          priority: number | null;
          project_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          title: string;
          description: string;
          justification: string;
          status?: ProjectIdeaStatus;
          priority?: number;
          project_id: string;
        };
        Update: {
          title?: string;
          description?: string;
          justification?: string;
          status?: ProjectIdeaStatus;
          priority?: number;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type ProjectStatus = 
  | 'DRAFT'
  | 'TRANSCRIPTIONS_UPLOADED'
  | 'AREAS_MAPPED'
  | 'NOTES_GENERATED'
  | 'NOTES_VALIDATED'
  | 'DIAGNOSIS_GENERATED'
  | 'DIAGNOSIS_VALIDATED'
  | 'IDEAS_GENERATED'
  | 'IDEAS_VALIDATED'
  | 'COMPLETED';

export type ProjectIdeaStatus = 
  | 'PROPOSED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'MODIFIED';

// Tipos derivados para uso en la aplicación
export type Project = Database['public']['Tables']['projects']['Row'];
export type Area = Database['public']['Tables']['areas']['Row'];
export type Transcription = Database['public']['Tables']['transcriptions']['Row'];
export type Note = Database['public']['Tables']['notes']['Row'];
export type Diagnosis = Database['public']['Tables']['diagnosis']['Row'];
export type ProjectIdea = Database['public']['Tables']['project_ideas']['Row'];

export type CreateProject = Database['public']['Tables']['projects']['Insert'];
export type UpdateProject = Database['public']['Tables']['projects']['Update'];
export type CreateArea = Database['public']['Tables']['areas']['Insert'];
export type UpdateArea = Database['public']['Tables']['areas']['Update'];
export type CreateTranscription = Database['public']['Tables']['transcriptions']['Insert'];
export type UpdateTranscription = Database['public']['Tables']['transcriptions']['Update'];
export type CreateNote = Database['public']['Tables']['notes']['Insert'];
export type UpdateNote = Database['public']['Tables']['notes']['Update'];
export type CreateDiagnosis = Database['public']['Tables']['diagnosis']['Insert'];
export type UpdateDiagnosis = Database['public']['Tables']['diagnosis']['Update'];
export type CreateProjectIdea = Database['public']['Tables']['project_ideas']['Insert'];
export type UpdateProjectIdea = Database['public']['Tables']['project_ideas']['Update']; 