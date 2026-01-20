/**
 * ===========================================
 * LEADS API ROUTE
 * ===========================================
 * CRUD operations for lead management.
 * Handles GET, POST, PUT, DELETE requests.
 */

import { NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase/server';
import { calculateLeadScore } from '@/lib/leads/scoring';
import { getServiceTier } from '@/lib/leads/categorization';
import { validateLeadLocation } from '@/lib/leads/validation';
import type { LeadInsert, LeadUpdate } from '@/lib/supabase/types';

/**
 * GET /api/leads
 * Fetches all leads with optional filtering.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const supabase = getServerSupabaseClient();
    
    // Build query
    let query = supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Apply filters from query params
    const status = searchParams.get('status');
    if (status) {
      query = query.eq('status', status);
    }
    
    const tier = searchParams.get('tier');
    if (tier) {
      query = query.eq('service_tier', parseInt(tier));
    }
    
    const stage = searchParams.get('stage');
    if (stage) {
      query = query.eq('pipeline_stage', stage);
    }
    
    // VA only filter (default true)
    const vaOnly = searchParams.get('va_only') !== 'false';
    if (vaOnly) {
      query = query.eq('state', 'VA');
    }
    
    // Pagination
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    query = query.range(offset, offset + limit - 1);
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching leads:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ leads: data });
  } catch (error) {
    console.error('Leads GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/leads
 * Creates a new lead with auto-scoring and validation.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = getServerSupabaseClient();
    
    // Validate required fields
    if (!body.name || !body.location || !body.zip_code || !body.service_type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, location, zip_code, service_type' },
        { status: 400 }
      );
    }
    
    // Validate Virginia location
    const validation = validateLeadLocation(body.zip_code, body.state);
    
    // Get service tier
    const serviceTier = getServiceTier(body.service_type);
    
    // Calculate lead score
    const leadScore = calculateLeadScore({
      serviceTier,
      projectScope: body.project_scope,
      estimatedValue: body.estimated_value,
      county: validation.county,
      hasEmail: !!body.email,
      hasPhone: !!body.phone,
    });
    
    // Prepare lead data
    const leadData: LeadInsert = {
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      location: body.location,
      zip_code: body.zip_code,
      county: validation.county || null,
      state: validation.isVirginia ? 'VA' : body.state || 'Unknown',
      address: body.address || null,
      service_type: body.service_type,
      service_tier: serviceTier,
      project_scope: body.project_scope || null,
      estimated_value: body.estimated_value || null,
      lead_score: leadScore,
      pipeline_stage: 'new',
      status: validation.isVirginia ? 'active' : 'archived',
      notes: body.notes || null,
      discovered_at: body.discovered_at || new Date().toISOString(),
      // Lead Finder fields
      lead_type: body.lead_type || null,
      company: body.company || null,
      website: body.website || null,
      instagram: body.instagram || null,
      facebook: body.facebook || null,
      tags: body.tags || null,
      confidence_score: body.confidence_score || null,
      service_need: body.service_need || null,
    };
    
    // Insert lead (cast to bypass type checking)
    const { data, error } = await (supabase
      .from('leads') as any)
      .insert(leadData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating lead:', error);
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      );
    }
    
    // Also create initial pipeline stage record
    if (data && (data as any).id) {
      await supabase.from('pipeline_stages').insert({
        lead_id: (data as any).id,
        stage: 'new',
      } as any);
    }
    
    return NextResponse.json({
      lead: data,
      validation,
      message: validation.isVirginia
        ? 'Lead created successfully'
        : 'Lead created but marked archived (outside VA service area)',
    });
  } catch (error) {
    console.error('Leads POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/leads
 * Updates an existing lead.
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const supabase = getServerSupabaseClient();
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      );
    }
    
    // Prepare update data
    const updateData: LeadUpdate = {};
    
    // Only include fields that are provided
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.zip_code !== undefined) updateData.zip_code = body.zip_code;
    if (body.county !== undefined) updateData.county = body.county;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.service_type !== undefined) updateData.service_type = body.service_type;
    if (body.project_scope !== undefined) updateData.project_scope = body.project_scope;
    if (body.estimated_value !== undefined) updateData.estimated_value = body.estimated_value;
    if (body.pipeline_stage !== undefined) updateData.pipeline_stage = body.pipeline_stage;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.last_contacted_at !== undefined) updateData.last_contacted_at = body.last_contacted_at;
    // Lead Finder fields
    if (body.lead_type !== undefined) updateData.lead_type = body.lead_type;
    if (body.company !== undefined) updateData.company = body.company;
    if (body.website !== undefined) updateData.website = body.website;
    if (body.instagram !== undefined) updateData.instagram = body.instagram;
    if (body.facebook !== undefined) updateData.facebook = body.facebook;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.confidence_score !== undefined) updateData.confidence_score = body.confidence_score;
    if (body.service_need !== undefined) updateData.service_need = body.service_need;
    
    // Update lead (cast supabase call to bypass type checking due to missing fields in generated types)
    const { data, error } = await (supabase
      .from('leads') as any)
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating lead:', error);
      return NextResponse.json(
        { error: 'Failed to update lead' },
        { status: 500 }
      );
    }
    
    // If pipeline stage changed, record it
    if (body.pipeline_stage) {
      await supabase.from('pipeline_stages').insert({
        lead_id: body.id,
        stage: body.pipeline_stage,
      } as any);
    }
    
    return NextResponse.json({ lead: data });
  } catch (error) {
    console.error('Leads PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/leads
 * Archives or deletes a lead.
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const permanent = searchParams.get('permanent') === 'true';
    
    if (!id) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      );
    }
    
    const supabase = getServerSupabaseClient();
    
    if (permanent) {
      // Permanently delete
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting lead:', error);
        return NextResponse.json(
          { error: 'Failed to delete lead' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ message: 'Lead permanently deleted' });
    } else {
      // Soft delete (archive)
      const { data, error } = await (supabase
        .from('leads') as any)
        .update({ status: 'archived' })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error archiving lead:', error);
        return NextResponse.json(
          { error: 'Failed to archive lead' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ lead: data, message: 'Lead archived' });
    }
  } catch (error) {
    console.error('Leads DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
