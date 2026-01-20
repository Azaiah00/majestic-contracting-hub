/**
 * ===========================================
 * SUPABASE DATABASE TYPES
 * ===========================================
 * TypeScript types for the Majestic database schema.
 * These provide full type safety when interacting with Supabase.
 * 
 * Note: These types can be auto-generated using:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Main database type definition.
 * Maps to all tables and their schemas in Supabase.
 */
export interface Database {
  public: {
    Tables: {
      // ==========================================
      // LEADS TABLE
      // Core table storing all lead information
      // ==========================================
      leads: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          phone: string | null;
          location: string;
          zip_code: string;
          county: string | null;
          state: string;
          address: string | null;
          service_type: string;
          service_tier: number;
          project_scope: string | null;
          estimated_value: number | null;
          lead_score: number;
          pipeline_stage: string;
          status: string;
          notes: string | null;
          last_contacted_at: string | null;
          discovered_at: string | null;
          // Lead Finder fields
          lead_type: string | null;
          company: string | null;
          website: string | null;
          instagram: string | null;
          facebook: string | null;
          tags: string[] | null;
          confidence_score: number | null;
          service_need: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          location: string;
          zip_code: string;
          county?: string | null;
          state?: string;
          address?: string | null;
          service_type: string;
          service_tier: number;
          project_scope?: string | null;
          estimated_value?: number | null;
          lead_score?: number;
          pipeline_stage?: string;
          status?: string;
          notes?: string | null;
          last_contacted_at?: string | null;
          discovered_at?: string | null;
          // Lead Finder fields
          lead_type?: string | null;
          company?: string | null;
          website?: string | null;
          instagram?: string | null;
          facebook?: string | null;
          tags?: string[] | null;
          confidence_score?: number | null;
          service_need?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          location?: string;
          zip_code?: string;
          county?: string | null;
          state?: string;
          address?: string | null;
          service_type?: string;
          service_tier?: number;
          project_scope?: string | null;
          estimated_value?: number | null;
          lead_score?: number;
          pipeline_stage?: string;
          status?: string;
          notes?: string | null;
          last_contacted_at?: string | null;
          discovered_at?: string | null;
          // Lead Finder fields
          lead_type?: string | null;
          company?: string | null;
          website?: string | null;
          instagram?: string | null;
          facebook?: string | null;
          tags?: string[] | null;
          confidence_score?: number | null;
          service_need?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      // ==========================================
      // SERVICES TABLE
      // Lookup table for all Majestic service types
      // ==========================================
      services: {
        Row: {
          id: string;
          name: string;
          tier: number;
          category: string;
        };
        Insert: {
          id?: string;
          name: string;
          tier: number;
          category: string;
        };
        Update: {
          id?: string;
          name?: string;
          tier?: number;
          category?: string;
        };
      };

      // ==========================================
      // PIPELINE STAGES TABLE
      // Tracks lead progression through pipeline
      // ==========================================
      pipeline_stages: {
        Row: {
          id: string;
          lead_id: string;
          stage: string;
          entered_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          stage: string;
          entered_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          stage?: string;
          entered_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

/**
 * Convenience type aliases for cleaner imports.
 * Use these throughout the application.
 */
export type Lead = Database['public']['Tables']['leads']['Row'];
export type LeadInsert = Database['public']['Tables']['leads']['Insert'];
export type LeadUpdate = Database['public']['Tables']['leads']['Update'];

export type Service = Database['public']['Tables']['services']['Row'];
export type ServiceInsert = Database['public']['Tables']['services']['Insert'];

export type PipelineStage = Database['public']['Tables']['pipeline_stages']['Row'];
export type PipelineStageInsert = Database['public']['Tables']['pipeline_stages']['Insert'];
