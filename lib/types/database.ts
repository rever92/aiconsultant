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
          current_step: number;
          step_1_completed: boolean;
          step_2_completed: boolean;
          step_3_completed: boolean;
          step_4_completed: boolean;
        };
        Insert: {
          name: string;
          description?: string;
          status?: ProjectStatus;
          user_id: string;
          current_step?: number;
          step_1_completed?: boolean;
          step_2_completed?: boolean;
          step_3_completed?: boolean;
          step_4_completed?: boolean;
        };
        Update: {
          name?: string;
          description?: string;
          status?: ProjectStatus;
          current_step?: number;
          step_1_completed?: boolean;
          step_2_completed?: boolean;
          step_3_completed?: boolean;
          step_4_completed?: boolean;
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
      consolidated_knowledge: {
        Row: {
          id: string;
          area_id: string;
          content: string;
          ai_generated: boolean;
          validated: boolean;
          original_sources_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          area_id: string;
          content: string;
          ai_generated?: boolean;
          validated?: boolean;
          original_sources_count?: number;
        };
        Update: {
          content?: string;
          validated?: boolean;
          original_sources_count?: number;
        };
      };
      analysis_as_is: {
        Row: {
          id: string;
          project_id: string;
          strategy_governance: string | null;
          processes_operations: string | null;
          technology_infrastructure: string | null;
          data_information: string | null;
          people_culture: string | null;
          customer_experience: string | null;
          conclusions: string | null;
          ai_generated: boolean;
          validated: boolean;
          version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          project_id: string;
          strategy_governance?: string;
          processes_operations?: string;
          technology_infrastructure?: string;
          data_information?: string;
          people_culture?: string;
          customer_experience?: string;
          conclusions?: string;
          ai_generated?: boolean;
          validated?: boolean;
          version?: number;
        };
        Update: {
          strategy_governance?: string;
          processes_operations?: string;
          technology_infrastructure?: string;
          data_information?: string;
          people_culture?: string;
          customer_experience?: string;
          conclusions?: string;
          validated?: boolean;
        };
      };
      analysis_as_is_versions: {
        Row: {
          id: string;
          analysis_id: string;
          version: number;
          strategy_governance: string | null;
          processes_operations: string | null;
          technology_infrastructure: string | null;
          data_information: string | null;
          people_culture: string | null;
          customer_experience: string | null;
          conclusions: string | null;
          change_summary: string | null;
          created_by_user: boolean;
          created_at: string;
        };
        Insert: {
          analysis_id: string;
          version: number;
          strategy_governance?: string;
          processes_operations?: string;
          technology_infrastructure?: string;
          data_information?: string;
          people_culture?: string;
          customer_experience?: string;
          conclusions?: string;
          change_summary?: string;
          created_by_user?: boolean;
        };
        Update: never;
      };
      project_recommendations: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string;
          justification: string;
          category: ProjectRecommendationCategory;
          priority: number;
          status: ProjectRecommendationStatus;
          ai_generated: boolean;
          validated: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          project_id: string;
          title: string;
          description: string;
          justification: string;
          category: ProjectRecommendationCategory;
          priority?: number;
          status?: ProjectRecommendationStatus;
          ai_generated?: boolean;
          validated?: boolean;
        };
        Update: {
          title?: string;
          description?: string;
          justification?: string;
          category?: ProjectRecommendationCategory;
          priority?: number;
          status?: ProjectRecommendationStatus;
          validated?: boolean;
        };
      };
      project_sheets: {
        Row: {
          id: string;
          recommendation_id: string;
          project_id: string;
          title: string;
          description: string;
          expected_benefits: string | null;
          strategic_objectives: string | null;
          human_resources: string | null;
          technological_resources: string | null;
          estimated_investment: number | null;
          estimated_duration: number | null;
          involved_areas: string | null;
          validated: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          recommendation_id: string;
          project_id: string;
          title: string;
          description: string;
          expected_benefits?: string;
          strategic_objectives?: string;
          human_resources?: string;
          technological_resources?: string;
          estimated_investment?: number;
          estimated_duration?: number;
          involved_areas?: string;
          validated?: boolean;
        };
        Update: {
          title?: string;
          description?: string;
          expected_benefits?: string;
          strategic_objectives?: string;
          human_resources?: string;
          technological_resources?: string;
          estimated_investment?: number;
          estimated_duration?: number;
          involved_areas?: string;
          validated?: boolean;
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

export type ProjectRecommendationCategory = 
  | 'technological'
  | 'training'
  | 'cultural'
  | 'methodological';

export type ProjectRecommendationStatus = 
  | 'proposed'
  | 'accepted'
  | 'rejected'
  | 'modified';

// Tipos derivados para uso en la aplicación
export type Project = Database['public']['Tables']['projects']['Row'];
export type Area = Database['public']['Tables']['areas']['Row'];
export type Transcription = Database['public']['Tables']['transcriptions']['Row'];
export type Note = Database['public']['Tables']['notes']['Row'];
export type Diagnosis = Database['public']['Tables']['diagnosis']['Row'];
export type ProjectIdea = Database['public']['Tables']['project_ideas']['Row'];

// Nuevos tipos para flujo guiado
export type ConsolidatedKnowledge = Database['public']['Tables']['consolidated_knowledge']['Row'];
export type AnalysisAsIs = Database['public']['Tables']['analysis_as_is']['Row'];
export type AnalysisAsIsVersion = Database['public']['Tables']['analysis_as_is_versions']['Row'];
export type ProjectRecommendation = Database['public']['Tables']['project_recommendations']['Row'];
export type ProjectSheet = Database['public']['Tables']['project_sheets']['Row'];

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

// Nuevos tipos Create/Update para flujo guiado
export type CreateConsolidatedKnowledge = Database['public']['Tables']['consolidated_knowledge']['Insert'];
export type UpdateConsolidatedKnowledge = Database['public']['Tables']['consolidated_knowledge']['Update'];
export type CreateAnalysisAsIs = Database['public']['Tables']['analysis_as_is']['Insert'];
export type UpdateAnalysisAsIs = Database['public']['Tables']['analysis_as_is']['Update'];
export type CreateAnalysisAsIsVersion = Database['public']['Tables']['analysis_as_is_versions']['Insert'];
export type CreateProjectRecommendation = Database['public']['Tables']['project_recommendations']['Insert'];
export type UpdateProjectRecommendation = Database['public']['Tables']['project_recommendations']['Update'];
export type CreateProjectSheet = Database['public']['Tables']['project_sheets']['Insert'];
export type UpdateProjectSheet = Database['public']['Tables']['project_sheets']['Update']; 