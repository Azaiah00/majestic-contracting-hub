/**
 * ===========================================
 * SUPABASE HOOKS
 * ===========================================
 * React hooks for fetching and managing data from Supabase.
 * These hooks handle loading states, errors, and real-time updates.
 */

'use client';

import { useState, useEffect } from 'react';
import { supabase } from './client';
import { Lead } from '@/types/lead';
import { calculateLeadScore } from '@/lib/leads/scoring';
import { isVirginiaZipCode, getCountyFromZip } from '@/lib/leads/validation';
import { getServiceTier } from '@/lib/leads/categorization';

/**
 * Hook to fetch all leads from Supabase.
 * Enriches leads with calculated fields (score, VA validation, etc.)
 */
export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch leads from Supabase
  const fetchLeads = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      const { data, error: fetchError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Enrich leads with calculated fields
      const enrichedLeads: Lead[] = (data || []).map((lead: any) => {
        const county = lead.county || getCountyFromZip(lead.zip_code);
        return {
          ...lead,
          is_va_lead: isVirginiaZipCode(lead.zip_code),
          county: county,
          service_tier: lead.service_tier || getServiceTier(lead.service_type),
          lead_score: lead.lead_score || calculateLeadScore({
            serviceTier: lead.service_tier || getServiceTier(lead.service_type),
            projectScope: lead.project_scope,
            estimatedValue: lead.estimated_value,
            county: county,
            hasEmail: !!lead.email,
            hasPhone: !!lead.phone,
          }),
          is_stale: checkIfStale(lead),
          discovered_at: new Date(lead.discovered_at || lead.created_at),
          created_at: new Date(lead.created_at),
          updated_at: new Date(lead.updated_at),
          last_contacted_at: lead.last_contacted_at ? new Date(lead.last_contacted_at) : undefined,
        };
      });

      setLeads(enrichedLeads);
    } catch (err: any) {
      console.error('Error fetching leads:', err);
      setError(err.message || 'Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  // Check if a lead is stale (no contact in 24h for new leads)
  const checkIfStale = (lead: any): boolean => {
    const lastContact = lead.last_contacted_at 
      ? new Date(lead.last_contacted_at).getTime()
      : null;
    const discovered = new Date(lead.discovered_at || lead.created_at).getTime();
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (lastContact) {
      return (now - lastContact) > twentyFourHours;
    }
    return lead.pipeline_stage === 'new' && (now - discovered) > twentyFourHours;
  };

  // Initial fetch
  useEffect(() => {
    fetchLeads();
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!supabase) return;
    
    const channel = supabase
      .channel('leads-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'leads' },
        () => {
          // Refetch when any change occurs
          fetchLeads();
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return { leads, loading, error, refetch: fetchLeads };
}

/**
 * Hook to fetch all services from Supabase.
 */
export function useServices() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      if (!supabase) {
        setError('Supabase client not initialized');
        setLoading(false);
        return;
      }
      try {
        const { data, error: fetchError } = await supabase
          .from('services')
          .select('*')
          .order('tier', { ascending: true });

        if (fetchError) throw fetchError;
        setServices(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  return { services, loading, error };
}

/**
 * Hook to add a new lead to Supabase.
 */
export function useAddLead() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addLead = async (leadData: Partial<Lead>) => {
    setLoading(true);
    setError(null);

    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      // Enrich with calculated fields before saving
      const zipCode = (leadData as any).zip_code || leadData.zipCode || '';
      const serviceType = (leadData as any).service_type || leadData.serviceType || '';
      const county = getCountyFromZip(zipCode);
      const serviceTier = getServiceTier(serviceType);
      const enrichedData: any = {
        ...leadData,
        zip_code: zipCode,
        service_type: serviceType,
        service_tier: serviceTier,
        lead_score: calculateLeadScore({
          serviceTier: serviceTier,
          projectScope: (leadData as any).project_scope || leadData.projectScope,
          estimatedValue: (leadData as any).estimated_value || leadData.estimatedValue,
          county: county,
          hasEmail: !!leadData.email,
          hasPhone: !!leadData.phone,
        }),
        county: county,
        state: isVirginiaZipCode(zipCode) ? 'VA' : leadData.state,
        status: isVirginiaZipCode(zipCode) ? 'active' : 'archived',
        pipeline_stage: (leadData as any).pipeline_stage || leadData.pipelineStage || 'new',
        discovered_at: new Date().toISOString(),
      };

      const { data, error: insertError } = await (supabase
        .from('leads') as any)
        .insert([enrichedData])
        .select()
        .single();

      if (insertError) throw insertError;
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { addLead, loading, error };
}

/**
 * Hook to update a lead's pipeline stage.
 */
export function useUpdateLeadStage() {
  const [loading, setLoading] = useState(false);

  const updateStage = async (leadId: string, newStage: string) => {
    setLoading(true);
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      const { error } = await (supabase
        .from('leads') as any)
        .update({ 
          pipeline_stage: newStage,
          updated_at: new Date().toISOString(),
          // If moving past 'new', mark as contacted
          ...(newStage !== 'new' && { last_contacted_at: new Date().toISOString() })
        })
        .eq('id', leadId);

      if (error) throw error;
    } finally {
      setLoading(false);
    }
  };

  return { updateStage, loading };
}
