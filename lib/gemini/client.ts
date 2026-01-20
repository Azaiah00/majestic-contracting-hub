/**
 * ===========================================
 * GEMINI API CLIENT
 * ===========================================
 * Integration with Google's Gemini AI for lead discovery,
 * enrichment, and intelligent categorization.
 * 
 * Uses Gemini 2.0/2.5 Flash for fast, cost-effective processing.
 * Supports Google Search tool for real-time lead discovery.
 */

// Gemini API configuration
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * Response structure from Gemini API.
 */
interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

/**
 * Structured lead data extracted by Gemini.
 */
export interface ExtractedLeadData {
  name: string;
  email?: string;
  phone?: string;
  location: string;
  zipCode: string;
  serviceType: string;
  projectDescription?: string;
  estimatedValue?: number;
}

/**
 * Sends a prompt to Gemini and returns the response text.
 * 
 * @param prompt - The prompt to send to Gemini
 * @returns The generated text response
 * @throws Error if the API call fails
 */
export async function generateContent(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
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
      // Configuration for consistent, structured outputs
      generationConfig: {
        temperature: 0.2, // Low temperature for more deterministic results
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data: GeminiResponse = await response.json();
  
  // Extract the text from the response
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    throw new Error('No response text from Gemini');
  }

  return text;
}

/**
 * Extracts structured lead data from unstructured text.
 * Uses Gemini to parse names, contact info, service type, etc.
 * 
 * @param rawText - Raw text containing lead information
 * @returns Structured lead data
 */
export async function extractLeadData(rawText: string): Promise<ExtractedLeadData> {
  const prompt = `
You are a lead data extraction assistant for Majestic Contracting, a Design | Build | Renovate company in Virginia.

Extract structured data from the following text. Return ONLY valid JSON with these fields:
- name (string, required): The person's full name
- email (string, optional): Email address if found
- phone (string, optional): Phone number if found  
- location (string, required): City or area in Virginia
- zipCode (string, required): ZIP code (Virginia ZIP codes start with 20, 22, or 23)
- serviceType (string, required): One of: New Construction, Full Renovation, Home Addition, Kitchen Remodel, Bathroom Remodel, Basement Remodel, Condo Renovation, Roofing, Deck, Concrete, Siding, Fence, She-Shed, Painting, Drywall, Flooring, Windows/Doors
- projectDescription (string, optional): Brief description of what they want
- estimatedValue (number, optional): Estimated project value in dollars

If a Virginia ZIP code is not provided, try to infer it from the location. If unknown, use "00000".

Text to extract from:
"""
${rawText}
"""

Return only the JSON object, no markdown formatting.
`;

  const response = await generateContent(prompt);
  
  // Clean up the response and parse JSON
  const cleanedResponse = response
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  try {
    return JSON.parse(cleanedResponse) as ExtractedLeadData;
  } catch (error) {
    throw new Error(`Failed to parse Gemini response as JSON: ${cleanedResponse}`);
  }
}

/**
 * Enriches existing lead data with AI-generated insights.
 * Adds project scope estimation, categorization, and summary.
 * 
 * @param lead - Basic lead information
 * @returns Enriched lead data with AI insights
 */
export async function enrichLeadData(lead: ExtractedLeadData): Promise<{
  serviceTier: number;
  leadSummary: string;
  suggestedEstimate?: number;
  projectScope: 'small' | 'medium' | 'large' | 'enterprise';
}> {
  const prompt = `
You are an expert estimator for Majestic Contracting, a Design | Build | Renovate company.

Analyze this lead and provide enrichment data:
- Name: ${lead.name}
- Location: ${lead.location}
- Service Type: ${lead.serviceType}
- Project Description: ${lead.projectDescription || 'Not provided'}
- Stated Value: ${lead.estimatedValue ? `$${lead.estimatedValue}` : 'Not provided'}

Return ONLY valid JSON with:
- serviceTier (number 1-4):
  1 = Epic (New Construction, Full Renovation, Home Addition) - $100k+
  2 = Modernize (Kitchen, Bath, Basement, Condo) - $30k-$150k
  3 = Exterior (Roof, Deck, Concrete, Siding, Fence, She-Shed) - $10k-$50k
  4 = Service (Paint, Drywall, Flooring, Windows/Doors) - $2k-$30k
- leadSummary (string): 1-2 sentence summary of the opportunity
- suggestedEstimate (number, optional): Estimated project value based on typical costs
- projectScope (string): "small", "medium", "large", or "enterprise"

Return only the JSON object.
`;

  const response = await generateContent(prompt);
  
  const cleanedResponse = response
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  try {
    return JSON.parse(cleanedResponse);
  } catch (error) {
    // Return defaults if parsing fails
    return {
      serviceTier: 4,
      leadSummary: `Lead interested in ${lead.serviceType}`,
      projectScope: 'medium',
    };
  }
}

/**
 * Lead type for AI discovery results.
 */
export type DiscoveredLeadType = 'Investor' | 'Property Manager' | 'HOA Manager' | 'Homeowner' | 'Commercial';

/**
 * Interface for discovered lead data from AI search.
 */
export interface DiscoveredLead {
  name: string;
  leadType: DiscoveredLeadType;
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
 * Finds leads in Virginia using Gemini with Google Search.
 * Uses AI-powered web search to discover potential leads.
 * 
 * @param city - Virginia city to search in
 * @param category - Service category to search for
 * @param count - Number of leads to find (5-20)
 * @returns Array of discovered leads
 */
export async function findLeads(
  city: string,
  category: string,
  count: number = 10
): Promise<DiscoveredLead[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  // Build specialized prompt for lead discovery
  const prompt = `Act as a High-End Construction Lead Researcher for Majestic Contracting, a Design | Build | Renovate company serving Virginia.

MISSION: Find ${count} potential leads in ${city}, Virginia who likely need ${category} services.

TARGET DEMAND SIGNALS - Search for these types of entities:
1. Property Managers/Landlords with multiple rental units in ${city}, VA
2. Local Real Estate Investors/Flippers who buy properties in ${city}
3. Commercial properties, HOAs, or property management companies in ${city}
4. Luxury homeowners in high-income areas of ${city}

SEARCH QUERIES TO USE:
- "${city} VA property management companies"
- "${city} Virginia real estate investors"
- "HOA management ${city} Virginia"
- "property managers ${city} VA"

For each lead, provide:
- name: Contact name or company name
- leadType: "Investor", "Property Manager", "HOA Manager", "Homeowner", or "Commercial"
- serviceNeed: Brief reason they might need ${category}
- email: Email if publicly available, otherwise null
- phone: Phone if publicly available, otherwise null
- address: Business/property address if available
- city: "${city}"
- zipCode: Virginia ZIP code (starts with 20, 22, or 23)
- website: Website URL if available
- company: Company name if applicable
- confidenceScore: 1-100 confidence this is a valid lead

CRITICAL RULES:
- ALL leads MUST be in Virginia (VA)
- ALL ZIP codes must be Virginia ZIPs (20xxx, 22xxx, 23xxx)
- Only return REAL information found via search
- Use null for missing contact info (don't make up data)

Return ONLY a valid JSON array. No markdown, no explanation.`;

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
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
      // Enable Google Search tool for real-time discovery
      tools: [
        {
          googleSearch: {},
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
        topP: 0.9,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data: GeminiResponse = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No response from Gemini');
  }

  // Parse the JSON response
  const cleaned = text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  // Extract JSON array
  const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
  const jsonStr = jsonMatch ? jsonMatch[0] : cleaned;

  try {
    const leads = JSON.parse(jsonStr);
    
    if (!Array.isArray(leads)) {
      throw new Error('Response is not an array');
    }

    // Validate and normalize each lead
    return leads.map((lead: any): DiscoveredLead => ({
      name: String(lead.name || 'Unknown'),
      leadType: validateLeadType(lead.leadType),
      serviceNeed: String(lead.serviceNeed || ''),
      email: lead.email || null,
      phone: lead.phone || null,
      address: lead.address || null,
      city: String(lead.city || city),
      zipCode: String(lead.zipCode || ''),
      website: lead.website || null,
      company: lead.company || null,
      confidenceScore: Math.min(100, Math.max(0, Number(lead.confidenceScore) || 50)),
    }));
  } catch (error) {
    console.error('Failed to parse Gemini lead discovery response:', error);
    throw new Error('Failed to parse lead data from AI');
  }
}

/**
 * Validates and normalizes lead type.
 */
function validateLeadType(type: any): DiscoveredLeadType {
  const validTypes: DiscoveredLeadType[] = [
    'Investor', 'Property Manager', 'HOA Manager', 'Homeowner', 'Commercial'
  ];
  
  const normalized = String(type || '').trim();
  return validTypes.find(t => 
    t.toLowerCase() === normalized.toLowerCase()
  ) || 'Homeowner';
}
