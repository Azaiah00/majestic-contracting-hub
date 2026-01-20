/**
 * ===========================================
 * LEAD DISCOVERY API ROUTE
 * ===========================================
 * Uses Gemini AI to extract and enrich lead
 * data from unstructured text input.
 */

import { NextResponse } from 'next/server';
import { extractLeadData, enrichLeadData } from '@/lib/gemini/client';
import { getServerSupabaseClient } from '@/lib/supabase/server';
import { calculateLeadScore } from '@/lib/leads/scoring';
import { getServiceTier, findClosestService } from '@/lib/leads/categorization';
import { validateLeadLocation } from '@/lib/leads/validation';
import type { LeadInsert } from '@/lib/supabase/types';

/**
 * POST /api/leads/discover
 * Extracts lead data from raw text using Gemini AI.
 * 
 * Request body:
 * - text: Raw text containing lead information
 * - autoSave: Whether to automatically save to database (default: false)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    if (!body.text || typeof body.text !== 'string') {
      return NextResponse.json(
        { error: 'Text input is required' },
        { status: 400 }
      );
    }
    
    // Check for Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }
    
    console.log('Discovering lead from text:', body.text.substring(0, 100) + '...');
    
    // Step 1: Extract structured data using Gemini
    let extractedData;
    try {
      extractedData = await extractLeadData(body.text);
    } catch (error) {
      console.error('Gemini extraction error:', error);
      return NextResponse.json(
        { error: 'Failed to extract lead data from text' },
        { status: 422 }
      );
    }
    
    // Step 2: Validate and normalize service type
    let serviceType = extractedData.serviceType;
    if (!getServiceTier(serviceType as any)) {
      // Try to find closest match
      const closestService = findClosestService(serviceType);
      if (closestService) {
        serviceType = closestService;
      } else {
        serviceType = 'Full Renovation'; // Default fallback
      }
    }
    
    // Step 3: Validate Virginia location
    const validation = validateLeadLocation(extractedData.zipCode);
    
    // Step 4: Enrich with AI insights
    let enrichment;
    try {
      enrichment = await enrichLeadData({
        ...extractedData,
        serviceType,
      });
    } catch (error) {
      console.error('Gemini enrichment error:', error);
      // Continue without enrichment
      enrichment = {
        serviceTier: getServiceTier(serviceType as any),
        leadSummary: `Lead interested in ${serviceType}`,
        projectScope: 'medium' as const,
      };
    }
    
    // Step 5: Calculate lead score
    const leadScore = calculateLeadScore({
      serviceTier: enrichment.serviceTier,
      projectScope: enrichment.projectScope,
      estimatedValue: enrichment.suggestedEstimate || extractedData.estimatedValue,
      county: validation.county,
      hasEmail: !!extractedData.email,
      hasPhone: !!extractedData.phone,
    });
    
    // Prepare response data
    const discoveredLead = {
      name: extractedData.name,
      email: extractedData.email || null,
      phone: extractedData.phone || null,
      location: extractedData.location,
      zipCode: extractedData.zipCode,
      county: validation.county,
      state: validation.isVirginia ? 'VA' : 'Unknown',
      serviceType,
      serviceTier: enrichment.serviceTier,
      projectScope: enrichment.projectScope,
      estimatedValue: enrichment.suggestedEstimate || extractedData.estimatedValue || null,
      leadScore,
      leadSummary: enrichment.leadSummary,
      isVirginiaValidated: validation.isVirginia,
      validationMessage: validation.message,
    };
    
    // Step 6: Optionally save to database
    if (body.autoSave && validation.isVirginia) {
      const supabase = getServerSupabaseClient();
      
      const leadData: LeadInsert = {
        name: discoveredLead.name,
        email: discoveredLead.email || null,
        phone: discoveredLead.phone || null,
        location: discoveredLead.location,
        zip_code: discoveredLead.zipCode,
        county: discoveredLead.county || null,
        state: discoveredLead.state,
        service_type: discoveredLead.serviceType,
        service_tier: discoveredLead.serviceTier,
        project_scope: discoveredLead.projectScope || null,
        estimated_value: discoveredLead.estimatedValue || null,
        lead_score: discoveredLead.leadScore,
        pipeline_stage: 'new',
        status: 'active',
        notes: `AI Summary: ${discoveredLead.leadSummary}` || null,
        discovered_at: new Date().toISOString(),
        // Lead Finder fields (optional)
        address: null,
        lead_type: null,
        company: null,
        website: null,
        instagram: null,
        facebook: null,
        tags: null,
        confidence_score: null,
        service_need: null,
      };
      
      const { data, error } = await supabase
        .from('leads')
        .insert(leadData as any)
        .select()
        .single();
      
      if (error) {
        console.error('Error saving discovered lead:', error);
        return NextResponse.json({
          lead: discoveredLead,
          saved: false,
          saveError: 'Failed to save lead to database',
        });
      }
      
      // Create initial pipeline stage (only if lead was saved successfully)
      if (data && (data as any).id) {
        await supabase.from('pipeline_stages').insert({
          lead_id: (data as any).id,
          stage: 'new',
        } as any);
      }
      
      return NextResponse.json({
        lead: { ...discoveredLead, id: (data as any).id },
        saved: true,
        message: 'Lead discovered and saved successfully',
      });
    }
    
    return NextResponse.json({
      lead: discoveredLead,
      saved: false,
      message: validation.isVirginia
        ? 'Lead discovered successfully (not saved)'
        : 'Lead discovered but outside VA service area',
    });
  } catch (error) {
    console.error('Lead discovery error:', error);
    return NextResponse.json(
      { error: 'Failed to process lead discovery' },
      { status: 500 }
    );
  }
}
