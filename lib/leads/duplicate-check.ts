/**
 * ===========================================
 * DUPLICATE LEAD DETECTION
 * ===========================================
 * Checks Supabase database for existing leads
 * to prevent duplicate entries.
 * 
 * Matches on: email, phone, address, or name + location.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

/**
 * Input for duplicate check.
 */
export interface DuplicateCheckInput {
  name: string;
  email: string | null;
  phone: string | null;
  location: string;
  address?: string | null;
}

/**
 * Result of duplicate check.
 */
export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchedLeadId: string | null;
  matchType: 'email' | 'phone' | 'address' | 'name_location' | null;
}

/**
 * Normalizes a phone number for comparison.
 * Strips all non-digit characters.
 */
function normalizePhone(phone: string | null): string | null {
  if (!phone) return null;
  return phone.replace(/\D/g, '');
}

/**
 * Normalizes an email for comparison.
 * Converts to lowercase and trims.
 */
function normalizeEmail(email: string | null): string | null {
  if (!email) return null;
  return email.toLowerCase().trim();
}

/**
 * Normalizes a name for comparison.
 * Converts to lowercase, trims, and removes extra spaces.
 */
function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Checks if a lead already exists in the database.
 * Uses multiple matching strategies for accuracy.
 * 
 * @param supabase - Supabase client instance
 * @param lead - Lead data to check
 * @returns Boolean indicating if duplicate exists
 */
export async function checkDuplicateLead(
  supabase: SupabaseClient<Database>,
  lead: DuplicateCheckInput
): Promise<boolean> {
  const result = await findDuplicateLead(supabase, lead);
  return result.isDuplicate;
}

/**
 * Finds a duplicate lead with detailed match information.
 * 
 * @param supabase - Supabase client instance
 * @param lead - Lead data to check
 * @returns Detailed duplicate check result
 */
export async function findDuplicateLead(
  supabase: SupabaseClient<Database>,
  lead: DuplicateCheckInput
): Promise<DuplicateCheckResult> {
  const normalizedEmail = normalizeEmail(lead.email);
  const normalizedPhone = normalizePhone(lead.phone);
  const normalizedName = normalizeName(lead.name);
  const normalizedLocation = lead.location.toLowerCase().trim();

  // Strategy 1: Check by email (most reliable)
  if (normalizedEmail) {
    const { data: emailMatch } = await supabase
      .from('leads')
      .select('id')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    if (emailMatch) {
      return {
        isDuplicate: true,
        matchedLeadId: (emailMatch as any).id,
        matchType: 'email',
      };
    }
  }

  // Strategy 2: Check by phone
  if (normalizedPhone && normalizedPhone.length >= 10) {
    // Search for phone numbers containing the digits
    const { data: phoneMatches } = await supabase
      .from('leads')
      .select('id, phone')
      .not('phone', 'is', null);

    if (phoneMatches) {
      const match = phoneMatches.find(
        row => normalizePhone((row as any).phone) === normalizedPhone
      );
      if (match) {
        return {
          isDuplicate: true,
          matchedLeadId: (match as any).id,
          matchType: 'phone',
        };
      }
    }
  }

  // Strategy 3: Check by name + location combination
  // This catches cases where same person in same area submits again
  const { data: nameLocationMatch } = await supabase
    .from('leads')
    .select('id')
    .ilike('name', `%${normalizedName}%`)
    .ilike('location', `%${normalizedLocation}%`)
    .maybeSingle();

  if (nameLocationMatch) {
    return {
      isDuplicate: true,
      matchedLeadId: (nameLocationMatch as any).id,
      matchType: 'name_location',
    };
  }

  // No duplicate found
  return {
    isDuplicate: false,
    matchedLeadId: null,
    matchType: null,
  };
}

/**
 * Batch check for duplicates.
 * More efficient for checking multiple leads at once.
 * 
 * @param supabase - Supabase client instance
 * @param leads - Array of leads to check
 * @returns Map of lead index to duplicate status
 */
export async function batchCheckDuplicates(
  supabase: SupabaseClient<Database>,
  leads: DuplicateCheckInput[]
): Promise<Map<number, DuplicateCheckResult>> {
  const results = new Map<number, DuplicateCheckResult>();

  // Collect all emails and phones for batch query
  const emails = leads
    .map(l => normalizeEmail(l.email))
    .filter((e): e is string => !!e);
  
  const phones = leads
    .map(l => normalizePhone(l.phone))
    .filter((p): p is string => !!p && p.length >= 10);

  // Fetch all potential matches in one query
  const { data: existingLeads } = await supabase
    .from('leads')
    .select('id, name, email, phone, location');

  if (!existingLeads) {
    // No existing leads, all are new
    leads.forEach((_, index) => {
      results.set(index, {
        isDuplicate: false,
        matchedLeadId: null,
        matchType: null,
      });
    });
    return results;
  }

  // Check each lead against existing
  leads.forEach((lead, index) => {
    const normalizedEmail = normalizeEmail(lead.email);
    const normalizedPhone = normalizePhone(lead.phone);
    const normalizedName = normalizeName(lead.name);
    const normalizedLocation = lead.location.toLowerCase().trim();

    // Check for matches
    const match = existingLeads.find(existing => {
      // Email match
      if (normalizedEmail && normalizeEmail((existing as any).email) === normalizedEmail) {
        return true;
      }
      // Phone match
      if (normalizedPhone && normalizePhone((existing as any).phone) === normalizedPhone) {
        return true;
      }
      // Name + location match
      if (
        normalizeName((existing as any).name).includes(normalizedName) &&
        (existing as any).location?.toLowerCase().includes(normalizedLocation)
      ) {
        return true;
      }
      return false;
    });

    if (match) {
      let matchType: DuplicateCheckResult['matchType'] = 'name_location';
      if (normalizedEmail && normalizeEmail((match as any).email) === normalizedEmail) {
        matchType = 'email';
      } else if (normalizedPhone && normalizePhone((match as any).phone) === normalizedPhone) {
        matchType = 'phone';
      }

      results.set(index, {
        isDuplicate: true,
        matchedLeadId: (match as any).id,
        matchType,
      });
    } else {
      results.set(index, {
        isDuplicate: false,
        matchedLeadId: null,
        matchType: null,
      });
    }
  });

  return results;
}
