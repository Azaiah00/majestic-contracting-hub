/**
 * ===========================================
 * MOCK LEAD DATA
 * ===========================================
 * Sample lead data for development and testing.
 * Simulates real Majestic leads in Virginia.
 */

import { ServiceTier, type PipelineStage, type ProjectScope } from '@/types/lead';
import { calculateLeadScore } from './scoring';
import { getServiceTier } from './categorization';

/**
 * Mock lead interface matching the database schema.
 */
export interface MockLead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  location: string;
  zipCode: string;
  county: string | null;
  state: string;
  serviceType: string;
  serviceTier: ServiceTier;
  projectScope: ProjectScope | null;
  estimatedValue: number | null;
  leadScore: number;
  pipelineStage: PipelineStage;
  status: string;
  notes: string | null;
  lastContactedAt: Date | null;
  discoveredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  isStale: boolean;
  isVirginiaValidated: boolean;
}

/**
 * Generates a random date within the last N days.
 */
function randomRecentDate(maxDaysAgo: number): Date {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * maxDaysAgo);
  const hoursAgo = Math.floor(Math.random() * 24);
  return new Date(now.getTime() - (daysAgo * 24 + hoursAgo) * 60 * 60 * 1000);
}

/**
 * Sample mock leads for development.
 */
export const MOCK_LEADS: MockLead[] = [
  // Tier 1 - Epic (Whales)
  {
    id: '1',
    name: 'Robert & Sarah Mitchell',
    email: 'mitchells@email.com',
    phone: '(703) 555-0101',
    location: 'Great Falls',
    zipCode: '22066',
    county: 'Fairfax',
    state: 'VA',
    serviceType: 'New Construction',
    serviceTier: ServiceTier.EPIC,
    projectScope: 'enterprise',
    estimatedValue: 450000,
    leadScore: 95,
    pipelineStage: 'design_phase',
    status: 'active',
    notes: 'Looking to build 4,500 sqft custom home on their lot. Timeline: 18 months.',
    lastContactedAt: randomRecentDate(1),
    discoveredAt: randomRecentDate(30),
    createdAt: randomRecentDate(30),
    updatedAt: new Date(),
    isStale: false,
    isVirginiaValidated: true,
  },
  {
    id: '2',
    name: 'Jennifer Walsh',
    email: 'jwalsh@corporate.com',
    phone: '(571) 555-0202',
    location: 'McLean',
    zipCode: '22101',
    county: 'Fairfax',
    state: 'VA',
    serviceType: 'Full Renovation',
    serviceTier: ServiceTier.EPIC,
    projectScope: 'large',
    estimatedValue: 285000,
    leadScore: 88,
    pipelineStage: 'quoted',
    status: 'active',
    notes: 'Complete gut renovation of 1970s colonial. Architectural plans approved.',
    lastContactedAt: randomRecentDate(2),
    discoveredAt: randomRecentDate(45),
    createdAt: randomRecentDate(45),
    updatedAt: new Date(),
    isStale: false,
    isVirginiaValidated: true,
  },
  {
    id: '3',
    name: 'David Chen',
    email: 'david.chen@outlook.com',
    phone: '(703) 555-0303',
    location: 'Vienna',
    zipCode: '22182',
    county: 'Fairfax',
    state: 'VA',
    serviceType: 'Home Addition',
    serviceTier: ServiceTier.EPIC,
    projectScope: 'large',
    estimatedValue: 175000,
    leadScore: 82,
    pipelineStage: 'contacted',
    status: 'active',
    notes: '800 sqft in-law suite addition. Needs separate entrance.',
    lastContactedAt: null,
    discoveredAt: randomRecentDate(3),
    createdAt: randomRecentDate(3),
    updatedAt: new Date(),
    isStale: true,
    isVirginiaValidated: true,
  },
  
  // Tier 2 - Modernize
  {
    id: '4',
    name: 'Amanda Torres',
    email: 'atorres@gmail.com',
    phone: '(571) 555-0404',
    location: 'Reston',
    zipCode: '20190',
    county: 'Fairfax',
    state: 'VA',
    serviceType: 'Kitchen Remodel',
    serviceTier: ServiceTier.MODERNIZE,
    projectScope: 'large',
    estimatedValue: 85000,
    leadScore: 72,
    pipelineStage: 'design_phase',
    status: 'active',
    notes: 'High-end kitchen with custom cabinets, Sub-Zero/Wolf appliances.',
    lastContactedAt: randomRecentDate(1),
    discoveredAt: randomRecentDate(14),
    createdAt: randomRecentDate(14),
    updatedAt: new Date(),
    isStale: false,
    isVirginiaValidated: true,
  },
  {
    id: '5',
    name: 'Michael Johnson',
    email: 'mjohnson@yahoo.com',
    phone: '(703) 555-0505',
    location: 'Arlington',
    zipCode: '22201',
    county: 'Arlington',
    state: 'VA',
    serviceType: 'Bathroom Remodel',
    serviceTier: ServiceTier.MODERNIZE,
    projectScope: 'medium',
    estimatedValue: 45000,
    leadScore: 65,
    pipelineStage: 'new',
    status: 'active',
    notes: 'Master bathroom remodel. Wants heated floors and walk-in shower.',
    lastContactedAt: null,
    discoveredAt: randomRecentDate(1),
    createdAt: randomRecentDate(1),
    updatedAt: new Date(),
    isStale: true,
    isVirginiaValidated: true,
  },
  {
    id: '6',
    name: 'Lisa Park',
    email: 'lisapark@email.com',
    phone: '(202) 555-0606',
    location: 'Alexandria',
    zipCode: '22314',
    county: 'Alexandria',
    state: 'VA',
    serviceType: 'Basement Remodel',
    serviceTier: ServiceTier.MODERNIZE,
    projectScope: 'large',
    estimatedValue: 95000,
    leadScore: 70,
    pipelineStage: 'contacted',
    status: 'active',
    notes: 'Full basement finish with home theater, wet bar, and guest suite.',
    lastContactedAt: randomRecentDate(2),
    discoveredAt: randomRecentDate(10),
    createdAt: randomRecentDate(10),
    updatedAt: new Date(),
    isStale: false,
    isVirginiaValidated: true,
  },
  {
    id: '7',
    name: 'Kevin Murphy',
    email: 'kmurphy@work.com',
    phone: '(703) 555-0707',
    location: 'Tysons',
    zipCode: '22102',
    county: 'Fairfax',
    state: 'VA',
    serviceType: 'Condo Renovation',
    serviceTier: ServiceTier.MODERNIZE,
    projectScope: 'medium',
    estimatedValue: 55000,
    leadScore: 58,
    pipelineStage: 'new',
    status: 'active',
    notes: 'Complete condo update. New flooring, kitchen, and both bathrooms.',
    lastContactedAt: null,
    discoveredAt: randomRecentDate(2),
    createdAt: randomRecentDate(2),
    updatedAt: new Date(),
    isStale: true,
    isVirginiaValidated: true,
  },
  
  // Tier 3 - Exterior
  {
    id: '8',
    name: 'Patricia Williams',
    email: 'pwilliams@email.com',
    phone: '(571) 555-0808',
    location: 'Centreville',
    zipCode: '20120',
    county: 'Fairfax',
    state: 'VA',
    serviceType: 'Deck',
    serviceTier: ServiceTier.EXTERIOR,
    projectScope: 'medium',
    estimatedValue: 35000,
    leadScore: 52,
    pipelineStage: 'quoted',
    status: 'active',
    notes: 'Composite deck with built-in seating and cable railings.',
    lastContactedAt: randomRecentDate(1),
    discoveredAt: randomRecentDate(7),
    createdAt: randomRecentDate(7),
    updatedAt: new Date(),
    isStale: false,
    isVirginiaValidated: true,
  },
  {
    id: '9',
    name: 'James Anderson',
    email: 'janderson@email.com',
    phone: '(703) 555-0909',
    location: 'Manassas',
    zipCode: '20110',
    county: 'Manassas',
    state: 'VA',
    serviceType: 'Roofing',
    serviceTier: ServiceTier.EXTERIOR,
    projectScope: 'medium',
    estimatedValue: 28000,
    leadScore: 48,
    pipelineStage: 'contacted',
    status: 'active',
    notes: 'Full roof replacement after storm damage. Insurance claim.',
    lastContactedAt: randomRecentDate(1),
    discoveredAt: randomRecentDate(5),
    createdAt: randomRecentDate(5),
    updatedAt: new Date(),
    isStale: false,
    isVirginiaValidated: true,
  },
  {
    id: '10',
    name: 'Nancy Davis',
    email: 'ndavis@email.com',
    phone: '(571) 555-1010',
    location: 'Ashburn',
    zipCode: '20147',
    county: 'Loudoun',
    state: 'VA',
    serviceType: 'She-Shed',
    serviceTier: ServiceTier.EXTERIOR,
    projectScope: 'small',
    estimatedValue: 18000,
    leadScore: 42,
    pipelineStage: 'new',
    status: 'active',
    notes: 'Wants a she-shed for art studio. Needs electric and AC.',
    lastContactedAt: null,
    discoveredAt: randomRecentDate(1),
    createdAt: randomRecentDate(1),
    updatedAt: new Date(),
    isStale: true,
    isVirginiaValidated: true,
  },
  
  // Tier 4 - Service
  {
    id: '11',
    name: 'Thomas Brown',
    email: 'tbrown@email.com',
    phone: '(703) 555-1111',
    location: 'Fairfax',
    zipCode: '22030',
    county: 'Fairfax',
    state: 'VA',
    serviceType: 'Painting',
    serviceTier: ServiceTier.SERVICE,
    projectScope: 'small',
    estimatedValue: 8500,
    leadScore: 35,
    pipelineStage: 'quoted',
    status: 'active',
    notes: 'Interior painting - whole house. Needs completed before holiday.',
    lastContactedAt: randomRecentDate(1),
    discoveredAt: randomRecentDate(3),
    createdAt: randomRecentDate(3),
    updatedAt: new Date(),
    isStale: false,
    isVirginiaValidated: true,
  },
  {
    id: '12',
    name: 'Elizabeth Wilson',
    email: 'ewilson@email.com',
    phone: '(571) 555-1212',
    location: 'Springfield',
    zipCode: '22150',
    county: 'Fairfax',
    state: 'VA',
    serviceType: 'Flooring',
    serviceTier: ServiceTier.SERVICE,
    projectScope: 'medium',
    estimatedValue: 15000,
    leadScore: 38,
    pipelineStage: 'contacted',
    status: 'active',
    notes: 'Hardwood flooring for main level, LVP for basement.',
    lastContactedAt: randomRecentDate(2),
    discoveredAt: randomRecentDate(6),
    createdAt: randomRecentDate(6),
    updatedAt: new Date(),
    isStale: false,
    isVirginiaValidated: true,
  },
  
  // Out of state lead (should be flagged)
  {
    id: '13',
    name: 'Mark Thompson',
    email: 'mthompson@email.com',
    phone: '(301) 555-1313',
    location: 'Bethesda',
    zipCode: '20814',
    county: null,
    state: 'MD',
    serviceType: 'Kitchen Remodel',
    serviceTier: ServiceTier.MODERNIZE,
    projectScope: 'large',
    estimatedValue: 75000,
    leadScore: 25,
    pipelineStage: 'new',
    status: 'archived',
    notes: 'Outside service area - Maryland',
    lastContactedAt: null,
    discoveredAt: randomRecentDate(1),
    createdAt: randomRecentDate(1),
    updatedAt: new Date(),
    isStale: false,
    isVirginiaValidated: false,
  },
];

/**
 * Gets all mock leads.
 */
export function getMockLeads(): MockLead[] {
  return MOCK_LEADS;
}

/**
 * Gets a single mock lead by ID.
 */
export function getMockLeadById(id: string): MockLead | undefined {
  return MOCK_LEADS.find(lead => lead.id === id);
}

/**
 * Filters mock leads by criteria.
 */
export function filterMockLeads(filters: {
  tiers?: ServiceTier[];
  services?: string[];
  stages?: PipelineStage[];
  isStale?: boolean;
  isVAOnly?: boolean;
}): MockLead[] {
  let filtered = [...MOCK_LEADS];
  
  if (filters.tiers?.length) {
    filtered = filtered.filter(lead => filters.tiers!.includes(lead.serviceTier));
  }
  
  if (filters.services?.length) {
    filtered = filtered.filter(lead => filters.services!.includes(lead.serviceType));
  }
  
  if (filters.stages?.length) {
    filtered = filtered.filter(lead => filters.stages!.includes(lead.pipelineStage));
  }
  
  if (filters.isStale !== undefined) {
    filtered = filtered.filter(lead => lead.isStale === filters.isStale);
  }
  
  if (filters.isVAOnly) {
    filtered = filtered.filter(lead => lead.isVirginiaValidated);
  }
  
  return filtered;
}
