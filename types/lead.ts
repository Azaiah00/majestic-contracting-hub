/**
 * ===========================================
 * LEAD TYPE DEFINITIONS
 * ===========================================
 * Core TypeScript types for the Majestic Lead system.
 * These types define the shape of lead data throughout the app.
 */

/**
 * Service tier enumeration.
 * Determines lead priority and scoring.
 */
export enum ServiceTier {
  EPIC = 1,        // Whale leads: New Construction, Full Renovation, Home Additions
  MODERNIZE = 2,   // Core revenue: Kitchen, Bath, Basement, Condo Remodels
  EXTERIOR = 3,    // Specialty: Roof, Deck, Concrete, Siding, Fence, She-Shed
  SERVICE = 4,     // High volume: Paint, Drywall, Flooring, Windows/Doors
}

/**
 * All Majestic service types organized by tier.
 */
export const MAJESTIC_SERVICES = {
  // Tier 1 - Epic (Whales)
  tier1: [
    'New Construction',
    'Full Renovation',
    'Home Addition',
  ],
  // Tier 2 - Modernize (Core Revenue)
  tier2: [
    'Kitchen Remodel',
    'Bathroom Remodel',
    'Basement Remodel',
    'Condo Renovation',
  ],
  // Tier 3 - Exterior (Specialty)
  tier3: [
    'Roofing',
    'Deck',
    'Concrete',
    'Siding',
    'Fence',
    'She-Shed',
  ],
  // Tier 4 - Service (High Volume)
  tier4: [
    'Painting',
    'Drywall',
    'Flooring',
    'Windows/Doors',
  ],
} as const;

/**
 * All 17 Majestic service types as a flat array.
 */
export const ALL_SERVICES = [
  ...MAJESTIC_SERVICES.tier1,
  ...MAJESTIC_SERVICES.tier2,
  ...MAJESTIC_SERVICES.tier3,
  ...MAJESTIC_SERVICES.tier4,
] as const;

export type ServiceType = (typeof ALL_SERVICES)[number];

/**
 * Pipeline stage for lead nurturing flow.
 */
export type PipelineStage = 
  | 'new'
  | 'contacted'
  | 'design_phase'
  | 'quoted'
  | 'closed';

/**
 * Lead status for filtering and management.
 */
export type LeadStatus = 
  | 'active'
  | 'archived'
  | 'converted'
  | 'lost';

/**
 * Project scope estimation.
 */
export type ProjectScope = 
  | 'small'      // Under $10k
  | 'medium'     // $10k - $50k
  | 'large'      // $50k - $150k
  | 'enterprise'; // $150k+

/**
 * Lead type classification.
 * Indicates the type of lead/prospect.
 */
export type LeadType = 
  | 'Investor'
  | 'Property Manager'
  | 'HOA Manager'
  | 'Homeowner'
  | 'Commercial';

/**
 * Lead tags for strategic categorization.
 */
export type LeadTag = 'Whale' | 'Quick-Turn' | 'Luxury' | 'Commercial' | 'Multi-Unit';

/**
 * Core Lead interface.
 * Represents a lead in the Majestic system.
 */
export interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  
  // Location (Virginia-focused)
  location: string;      // City/area name
  zipCode: string;       // VA zip codes: 20xxx, 22xxx, 23xxx
  county: string | null; // VA county
  state: string;         // Should always be 'VA' for valid leads
  address: string | null; // Full address if available
  
  // Service details
  serviceType: ServiceType;
  serviceTier: ServiceTier;
  projectScope: ProjectScope | null;
  estimatedValue: number | null;
  
  // Lead scoring and pipeline
  leadScore: number;      // 0-100 score based on tier, scope, etc.
  pipelineStage: PipelineStage;
  status: LeadStatus;
  
  // Lead Finder specific fields
  leadType: LeadType | null;     // Type of lead (Investor, Property Manager, etc.)
  company: string | null;        // Company name if applicable
  website: string | null;        // Website URL
  instagram: string | null;      // Instagram handle
  facebook: string | null;       // Facebook URL
  tags: LeadTag[];               // Strategic tags (Whale, Quick-Turn, Luxury)
  confidenceScore: number | null; // AI confidence score (0-100)
  serviceNeed: string | null;    // Why they need the service
  
  // Notes and history
  notes: string | null;
  lastContactedAt: Date | null;
  
  // Timestamps
  discoveredAt: Date | null;  // When Gemini discovered this lead
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Lead creation input (partial, with defaults applied).
 */
export interface CreateLeadInput {
  name: string;
  email?: string;
  phone?: string;
  location: string;
  zipCode: string;
  county?: string;
  address?: string;
  serviceType: ServiceType;
  projectScope?: ProjectScope;
  estimatedValue?: number;
  notes?: string;
  // Lead Finder fields
  leadType?: LeadType;
  company?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  tags?: LeadTag[];
  confidenceScore?: number;
  serviceNeed?: string;
}

/**
 * Lead update input (all fields optional).
 */
export interface UpdateLeadInput {
  name?: string;
  email?: string | null;
  phone?: string | null;
  location?: string;
  zipCode?: string;
  county?: string | null;
  address?: string | null;
  serviceType?: ServiceType;
  projectScope?: ProjectScope | null;
  estimatedValue?: number | null;
  pipelineStage?: PipelineStage;
  status?: LeadStatus;
  notes?: string | null;
  lastContactedAt?: Date | null;
  // Lead Finder fields
  leadType?: LeadType | null;
  company?: string | null;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  tags?: LeadTag[];
  confidenceScore?: number | null;
  serviceNeed?: string | null;
}

/**
 * Lead filter options for the dashboard.
 */
export interface LeadFilters {
  tiers?: ServiceTier[];
  services?: ServiceType[];
  pipelineStages?: PipelineStage[];
  statuses?: LeadStatus[];
  leadTypes?: LeadType[];
  tags?: LeadTag[];
  minScore?: number;
  maxScore?: number;
  search?: string;
  sortBy?: 'score' | 'createdAt' | 'updatedAt' | 'estimatedValue' | 'confidenceScore';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Lead with computed/derived properties.
 * Used in the UI for display purposes.
 */
export interface LeadWithMetadata extends Lead {
  isStale: boolean;          // True if not contacted in 24+ hours
  isVirginiaValidated: boolean;
  tierLabel: string;         // "Epic", "Modernize", etc.
  tierColor: string;         // CSS color for the tier
  daysSinceContact: number | null;
  // Tag helpers
  hasWhaleTag: boolean;      // Quick check for Whale tag
  hasLuxuryTag: boolean;     // Quick check for Luxury tag
  primaryTag: LeadTag | null; // Highest priority tag
}
