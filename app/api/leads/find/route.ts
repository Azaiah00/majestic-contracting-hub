/**
 * ===========================================
 * LEAD FINDER API ROUTE
 * ===========================================
 * AI-powered lead discovery using Gemini API
 * with Google Search integration.
 * 
 * Finds leads in Virginia based on service category.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { checkDuplicateLead } from '@/lib/leads/duplicate-check';
import { assignLeadTags, type LeadTag } from '@/lib/leads/tagging';
import { isVirginiaZipCode, getCountyFromZip, VA_COUNTY_NAMES } from '@/lib/leads/validation';
import { calculateLeadScore } from '@/lib/leads/scoring';
import { SERVICE_TO_TIER, findClosestService } from '@/lib/leads/categorization';
import { ServiceTier, type ServiceType } from '@/types/lead';

// Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * List of valid Virginia cities for validation.
 */
const VA_CITIES = [
  // NoVA
  'Fairfax', 'Arlington', 'Alexandria', 'McLean', 'Great Falls', 'Vienna',
  'Reston', 'Herndon', 'Falls Church', 'Tysons', 'Ashburn', 'Leesburg',
  'Sterling', 'Centreville', 'Chantilly', 'Annandale', 'Springfield',
  'Burke', 'Lorton', 'Woodbridge', 'Manassas', 'Gainesville', 'Dumfries',
  // Richmond Metro
  'Richmond', 'Henrico', 'Chesterfield', 'Midlothian', 'Glen Allen',
  'Short Pump', 'Mechanicsville', 'Colonial Heights', 'Petersburg',
  // Hampton Roads
  'Virginia Beach', 'Norfolk', 'Newport News', 'Hampton', 'Chesapeake',
  'Portsmouth', 'Suffolk', 'Williamsburg',
  // Central VA
  'Charlottesville', 'Lynchburg', 'Roanoke', 'Blacksburg', 'Salem',
  // Other
  'Fredericksburg', 'Stafford', 'Winchester', 'Harrisonburg',
];

/**
 * Interface for found lead data.
 */
interface FoundLead {
  name: string;
  leadType: 'Investor' | 'Property Manager' | 'HOA Manager' | 'Homeowner' | 'Commercial';
  serviceNeed: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string;
  zipCode: string;
  website: string | null;
  company: string | null;
  confidenceScore: number;
}

/**
 * Request body interface.
 */
interface FindLeadsRequest {
  city: string;
  category: string;
  leadCount?: number;
  locationType?: 'city' | 'county';
}

/**
 * VA-Only Validator Middleware.
 * Ensures the location is within Virginia (city or county).
 */
function normalizeCountyInput(input: string): string {
  // Remove "County" suffix so we can match consistently.
  return input.replace(/county/gi, '').trim();
}

function formatCountyDisplay(county: string): string {
  return `${county} County`;
}

function validateVirginiaLocation(
  location: string,
  locationType: 'city' | 'county'
): { valid: boolean; normalizedLocation: string | null } {
  const normalized = location.trim();

  if (locationType === 'county') {
    const cleaned = normalizeCountyInput(normalized);

    // Check if county is in our VA county list (case-insensitive)
    const match = VA_COUNTY_NAMES.find(
      c => c.toLowerCase() === cleaned.toLowerCase()
    );

    if (match) {
      return { valid: true, normalizedLocation: formatCountyDisplay(match) };
    }

    // Try partial match
    const partialMatch = VA_COUNTY_NAMES.find(
      c => c.toLowerCase().includes(cleaned.toLowerCase()) ||
           cleaned.toLowerCase().includes(c.toLowerCase())
    );

    if (partialMatch) {
      return { valid: true, normalizedLocation: formatCountyDisplay(partialMatch) };
    }

    return { valid: false, normalizedLocation: null };
  }

  // City validation (case-insensitive)
  const match = VA_CITIES.find(
    c => c.toLowerCase() === normalized.toLowerCase()
  );

  if (match) {
    return { valid: true, normalizedLocation: match };
  }

  // Try partial match
  const partialMatch = VA_CITIES.find(
    c => c.toLowerCase().includes(normalized.toLowerCase()) ||
         normalized.toLowerCase().includes(c.toLowerCase())
  );

  if (partialMatch) {
    return { valid: true, normalizedLocation: partialMatch };
  }

  return { valid: false, normalizedLocation: null };
}

/**
 * Build the Gemini prompt for lead discovery.
 */
function buildLeadFinderPrompt(
  location: string,
  category: string,
  count: number,
  locationType: 'city' | 'county'
): string {
  return `Act as a High-End Construction Lead Researcher for Majestic Contracting, a Design | Build | Renovate company serving Virginia.

MISSION: Find ${count} potential leads in ${location}, Virginia who likely need ${category} services.
LOCATION TYPE: ${locationType} (city or county)

TARGET DEMAND SIGNALS - Search for these types of entities:
1. Property Managers/Landlords with multiple rental units in ${location}, VA
2. Local Real Estate Investors/Flippers who buy properties in ${location}
3. Commercial properties, HOAs, or property management companies in ${location}
4. Luxury homeowners in high-income areas of ${location}
5. Recently listed or sold properties that may need renovation

SEARCH STRATEGY:
- Search for "${location} VA property management companies"
- Search for "${location} Virginia real estate investors"
- Search for "HOA management ${location} Virginia"
- Search for "${category} contractor leads ${location} VA"
- Search for "recently sold homes ${location} VA"

For each lead found, extract:
- name: Contact name or company name
- leadType: One of "Investor", "Property Manager", "HOA Manager", "Homeowner", or "Commercial"
- serviceNeed: Why they might need ${category} (e.g., "Manages 15 rental units needing updates")
- email: Email if publicly available, otherwise null
- phone: Phone if publicly available, otherwise null
- address: Property or business address if available
- city: "${location}" (use the county name if searching by county)
- zipCode: Virginia ZIP code (starts with 20, 22, or 23)
- website: Website URL if available
- company: Company name if applicable
- confidenceScore: 1-100 how confident you are this is a real lead

IMPORTANT RULES:
- ALL leads MUST be in Virginia (state = VA)
- ALL ZIP codes must be valid Virginia ZIPs (20xxx, 22xxx, 23xxx)
- Do NOT make up contact information - use null if not found
- Focus on REAL businesses and contacts found via web search
- Prioritize leads with actual contact information

Return ONLY a valid JSON array with ${count} leads. No markdown, no explanation.

Example format:
[
  {
    "name": "John Smith",
    "leadType": "Property Manager",
    "serviceNeed": "Manages 12 rental properties in Fairfax needing kitchen updates",
    "email": "john@example.com",
    "phone": "(703) 555-1234",
    "address": "123 Main St, Fairfax, VA 22030",
    "city": "Fairfax",
    "zipCode": "22030",
    "website": "https://smithproperties.com",
    "company": "Smith Property Management",
    "confidenceScore": 85
  }
]`;
}

/**
 * Call Gemini API with Google Search tool.
 */
async function callGeminiWithSearch(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      // Enable Google Search grounding
      tools: [
        {
          googleSearch: {},
        },
      ],
      generationConfig: {
        temperature: 0.7, // Slightly creative for search
        maxOutputTokens: 4096,
        topP: 0.9,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error:', errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  
  // Extract text from response
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    throw new Error('No response from Gemini');
  }

  return text;
}

/**
 * Parse Gemini response and extract leads.
 */
function parseLeadsFromResponse(response: string): FoundLead[] {
  // Clean markdown code blocks if present
  let cleaned = response
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  // Try to find JSON array in response
  const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  try {
    const leads = JSON.parse(cleaned);
    
    if (!Array.isArray(leads)) {
      throw new Error('Response is not an array');
    }

    // Validate and clean each lead
    return leads.map((lead: any) => ({
      name: String(lead.name || 'Unknown'),
      leadType: validateLeadType(lead.leadType),
      serviceNeed: String(lead.serviceNeed || ''),
      email: lead.email || null,
      phone: lead.phone || null,
      address: lead.address || null,
      city: String(lead.city || ''),
      zipCode: String(lead.zipCode || ''),
      website: lead.website || null,
      company: lead.company || null,
      confidenceScore: Math.min(100, Math.max(0, Number(lead.confidenceScore) || 50)),
    }));
  } catch (error) {
    console.error('Failed to parse Gemini response:', error);
    throw new Error('Failed to parse lead data from AI response');
  }
}

/**
 * Validate lead type string.
 */
function validateLeadType(type: string): FoundLead['leadType'] {
  const validTypes: FoundLead['leadType'][] = [
    'Investor', 'Property Manager', 'HOA Manager', 'Homeowner', 'Commercial'
  ];
  
  const normalized = String(type || '').trim();
  const match = validTypes.find(t => 
    t.toLowerCase() === normalized.toLowerCase()
  );
  
  return match || 'Homeowner';
}

/**
 * POST handler for lead discovery.
 */
export async function POST(request: NextRequest) {
  try {
    const body: FindLeadsRequest = await request.json();
    const { city, category, leadCount = 10, locationType = 'city' } = body;

    // Validate inputs
    if (!city || !category) {
      return NextResponse.json(
        { error: 'City/County and category are required' },
        { status: 400 }
      );
    }

    // VA-Only Validator: Ensure location is in Virginia
    const locationValidation = validateVirginiaLocation(city, locationType);
    if (!locationValidation.valid || !locationValidation.normalizedLocation) {
      return NextResponse.json(
        { error: `Location "${city}" is not in Virginia service area` },
        { status: 400 }
      );
    }

    const normalizedLocation = locationValidation.normalizedLocation;
    const count = Math.min(Math.max(5, leadCount), 20); // Clamp to 5-20

    // Build and execute Gemini search
    const prompt = buildLeadFinderPrompt(normalizedLocation, category, count, locationType);
    
    let rawResponse: string;
    try {
      rawResponse = await callGeminiWithSearch(prompt);
    } catch (geminiError: any) {
      console.error('Gemini search failed:', geminiError);
      return NextResponse.json(
        { error: 'AI search failed. Please try again.' },
        { status: 500 }
      );
    }

    // Parse leads from response
    let foundLeads: FoundLead[];
    try {
      foundLeads = parseLeadsFromResponse(rawResponse);
    } catch (parseError) {
      console.error('Parse error:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    // Filter to only valid Virginia leads
    const validLeads = foundLeads.filter(lead => {
      // Must have valid VA ZIP code
      if (!lead.zipCode || !isVirginiaZipCode(lead.zipCode)) {
        return false;
      }
      // Must have a name
      if (!lead.name || lead.name === 'Unknown') {
        return false;
      }
      return true;
    });

    // Initialize Supabase for duplicate checking
    let supabase: ReturnType<typeof createServerSupabaseClient> | null = null;
    try {
      supabase = createServerSupabaseClient();
    } catch (e) {
      console.warn('Supabase not configured, skipping duplicate check');
    }

    // Process leads: check duplicates, assign tags, calculate scores
    const processedLeads = await Promise.all(
      validLeads.map(async (lead) => {
        // Check for duplicates
        let isDuplicate = false;
        if (supabase) {
          isDuplicate = await checkDuplicateLead(supabase, {
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            location: lead.city,
          });
        }

        // Find matching service type
        const matchedService = findClosestService(category) || 'Full Renovation';
        const serviceTier = SERVICE_TO_TIER[matchedService as ServiceType] || ServiceTier.MODERNIZE;

        // Get county from ZIP
        const county = getCountyFromZip(lead.zipCode);

        // Assign tags based on service and location
        const tags = assignLeadTags({
          serviceType: matchedService as ServiceType,
          location: lead.city,
          county: county,
          leadType: lead.leadType,
        });

        // Calculate lead score
        const leadScore = calculateLeadScore({
          serviceTier,
          county,
          hasEmail: !!lead.email,
          hasPhone: !!lead.phone,
        });

        return {
          ...lead,
          county,
          serviceType: matchedService,
          serviceTier,
          tags,
          leadScore,
          isDuplicate,
          state: 'VA', // Force Virginia
        };
      })
    );

    // Return processed leads
    return NextResponse.json({
      success: true,
      city: normalizedLocation,
      category,
      totalFound: processedLeads.length,
      leads: processedLeads,
    });

  } catch (error: any) {
    console.error('Lead finder error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
