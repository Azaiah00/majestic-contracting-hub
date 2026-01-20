/**
 * ===========================================
 * SERVICE CATEGORIZATION
 * ===========================================
 * Maps the 17 Majestic services to their tiers
 * and provides utilities for service management.
 */

import { ServiceTier, type ServiceType } from '@/types/lead';

/**
 * Service tier configuration with metadata.
 * Defines the characteristics of each tier.
 */
export const TIER_CONFIG = {
  [ServiceTier.EPIC]: {
    name: 'Epic',
    description: 'Whale leads - High value, long-term projects',
    color: '#F4B400', // Gold
    minValue: 100000,
    maxValue: 500000,
    baseScore: 80,
  },
  [ServiceTier.MODERNIZE]: {
    name: 'Modernize',
    description: 'Core revenue - Bread and butter projects',
    color: '#006070', // Teal
    minValue: 30000,
    maxValue: 150000,
    baseScore: 60,
  },
  [ServiceTier.EXTERIOR]: {
    name: 'Exterior',
    description: 'Specialty - Entry point projects',
    color: '#7C3AED', // Purple
    minValue: 10000,
    maxValue: 50000,
    baseScore: 40,
  },
  [ServiceTier.SERVICE]: {
    name: 'Service',
    description: 'High volume - Quick turnaround',
    color: '#10B981', // Emerald
    minValue: 2000,
    maxValue: 30000,
    baseScore: 20,
  },
} as const;

/**
 * Complete service-to-tier mapping.
 * Maps each service name to its tier number.
 */
export const SERVICE_TO_TIER: Record<ServiceType, ServiceTier> = {
  // Tier 1 - Epic
  'New Construction': ServiceTier.EPIC,
  'Full Renovation': ServiceTier.EPIC,
  'Home Addition': ServiceTier.EPIC,
  
  // Tier 2 - Modernize
  'Kitchen Remodel': ServiceTier.MODERNIZE,
  'Bathroom Remodel': ServiceTier.MODERNIZE,
  'Basement Remodel': ServiceTier.MODERNIZE,
  'Condo Renovation': ServiceTier.MODERNIZE,
  
  // Tier 3 - Exterior
  'Roofing': ServiceTier.EXTERIOR,
  'Deck': ServiceTier.EXTERIOR,
  'Concrete': ServiceTier.EXTERIOR,
  'Siding': ServiceTier.EXTERIOR,
  'Fence': ServiceTier.EXTERIOR,
  'She-Shed': ServiceTier.EXTERIOR,
  
  // Tier 4 - Service
  'Painting': ServiceTier.SERVICE,
  'Drywall': ServiceTier.SERVICE,
  'Flooring': ServiceTier.SERVICE,
  'Windows/Doors': ServiceTier.SERVICE,
};

/**
 * Gets the tier for a given service type.
 * 
 * @param serviceType - The service type name
 * @returns The tier number (1-4)
 */
export function getServiceTier(serviceType: ServiceType): ServiceTier {
  return SERVICE_TO_TIER[serviceType] ?? ServiceTier.SERVICE;
}

/**
 * Gets the tier configuration for a given tier number.
 * 
 * @param tier - The tier number (1-4)
 * @returns The tier configuration object
 */
export function getTierConfig(tier: ServiceTier) {
  return TIER_CONFIG[tier];
}

/**
 * Gets the display label for a tier.
 * 
 * @param tier - The tier number (1-4)
 * @returns The tier name (e.g., "Epic", "Modernize")
 */
export function getTierLabel(tier: ServiceTier): string {
  return TIER_CONFIG[tier].name;
}

/**
 * Gets the color for a tier.
 * 
 * @param tier - The tier number (1-4)
 * @returns The CSS color value
 */
export function getTierColor(tier: ServiceTier): string {
  return TIER_CONFIG[tier].color;
}

/**
 * Gets all services for a specific tier.
 * 
 * @param tier - The tier number (1-4)
 * @returns Array of service names in that tier
 */
export function getServicesForTier(tier: ServiceTier): ServiceType[] {
  return Object.entries(SERVICE_TO_TIER)
    .filter(([, t]) => t === tier)
    .map(([service]) => service as ServiceType);
}

/**
 * Validates if a string is a valid service type.
 * 
 * @param service - The service string to validate
 * @returns True if valid, false otherwise
 */
export function isValidService(service: string): service is ServiceType {
  return service in SERVICE_TO_TIER;
}

/**
 * Finds the closest matching service type from a fuzzy input.
 * Useful for AI-extracted data that may not match exactly.
 * 
 * @param input - The fuzzy service input
 * @returns The closest matching service type or null
 */
export function findClosestService(input: string): ServiceType | null {
  const normalized = input.toLowerCase().trim();
  
  // Direct match
  for (const service of Object.keys(SERVICE_TO_TIER)) {
    if (service.toLowerCase() === normalized) {
      return service as ServiceType;
    }
  }
  
  // Partial match
  for (const service of Object.keys(SERVICE_TO_TIER)) {
    if (service.toLowerCase().includes(normalized) || 
        normalized.includes(service.toLowerCase())) {
      return service as ServiceType;
    }
  }
  
  // Keyword matching
  const keywordMap: Record<string, ServiceType> = {
    'kitchen': 'Kitchen Remodel',
    'bath': 'Bathroom Remodel',
    'bathroom': 'Bathroom Remodel',
    'basement': 'Basement Remodel',
    'condo': 'Condo Renovation',
    'roof': 'Roofing',
    'deck': 'Deck',
    'concrete': 'Concrete',
    'siding': 'Siding',
    'fence': 'Fence',
    'shed': 'She-Shed',
    'paint': 'Painting',
    'drywall': 'Drywall',
    'floor': 'Flooring',
    'window': 'Windows/Doors',
    'door': 'Windows/Doors',
    'addition': 'Home Addition',
    'renovation': 'Full Renovation',
    'remodel': 'Full Renovation',
    'new home': 'New Construction',
    'build': 'New Construction',
  };
  
  for (const [keyword, service] of Object.entries(keywordMap)) {
    if (normalized.includes(keyword)) {
      return service;
    }
  }
  
  return null;
}
