/**
 * ===========================================
 * LEAD TAGGING SYSTEM
 * ===========================================
 * Assigns strategic tags to leads based on
 * service type, location, and lead type.
 * 
 * Tags:
 * - Whale: High-value projects (New Construction, Full Renovation)
 * - Quick-Turn: Fast turnaround projects (Painting, Drywall, Flooring)
 * - Luxury: High-income areas in Virginia
 */

import { ServiceTier, type ServiceType } from '@/types/lead';
import { SERVICE_TO_TIER } from './categorization';

/**
 * Available lead tags.
 */
export type LeadTag = 'Whale' | 'Quick-Turn' | 'Luxury' | 'Commercial' | 'Multi-Unit';

/**
 * High-income Virginia areas for Luxury tag.
 * These are affluent areas in NoVA and other regions.
 */
const LUXURY_AREAS = [
  // NoVA Luxury
  'McLean',
  'Great Falls',
  'Vienna',
  'Oakton',
  'Clifton',
  'Potomac Falls',
  'Aldie',
  'Leesburg', // Some parts
  'Purcellville',
  // Alexandria Luxury
  'Old Town Alexandria',
  'Belle Haven',
  'Rosemont',
  // Other VA Luxury
  'Charlottesville',
  'Virginia Beach', // Oceanfront areas
  'Williamsburg',
];

/**
 * High-income Virginia counties.
 */
const LUXURY_COUNTIES = [
  'Fairfax',
  'Loudoun',
  'Arlington',
  'Alexandria',
  'Falls Church',
];

/**
 * Services that qualify for Whale tag.
 * These are high-value, long-term projects.
 */
const WHALE_SERVICES: ServiceType[] = [
  'New Construction',
  'Full Renovation',
  'Home Addition',
];

/**
 * Services that qualify for Quick-Turn tag.
 * These are fast turnaround, high-volume projects.
 */
const QUICK_TURN_SERVICES: ServiceType[] = [
  'Painting',
  'Drywall',
  'Flooring',
  'Windows/Doors',
];

/**
 * Lead types that indicate commercial or multi-unit.
 */
type LeadType = 'Investor' | 'Property Manager' | 'HOA Manager' | 'Homeowner' | 'Commercial';

/**
 * Input for tag assignment.
 */
export interface TagInput {
  serviceType: ServiceType;
  location: string;
  county: string | null;
  leadType?: LeadType | string;
  estimatedValue?: number | null;
}

/**
 * Assigns tags to a lead based on various factors.
 * 
 * @param input - Tag assignment input
 * @returns Array of assigned tags
 */
export function assignLeadTags(input: TagInput): LeadTag[] {
  const tags: LeadTag[] = [];
  const { serviceType, location, county, leadType, estimatedValue } = input;

  // Check for Whale tag (high-value services)
  if (WHALE_SERVICES.includes(serviceType)) {
    tags.push('Whale');
  }

  // Check for Whale tag based on value
  if (estimatedValue && estimatedValue >= 100000) {
    if (!tags.includes('Whale')) {
      tags.push('Whale');
    }
  }

  // Check for Quick-Turn tag (fast turnaround services)
  if (QUICK_TURN_SERVICES.includes(serviceType)) {
    tags.push('Quick-Turn');
  }

  // Check for Luxury tag (high-income areas)
  const isLuxuryArea = LUXURY_AREAS.some(
    area => location.toLowerCase().includes(area.toLowerCase())
  );
  const isLuxuryCounty = county && LUXURY_COUNTIES.some(
    c => c.toLowerCase() === county.toLowerCase()
  );

  if (isLuxuryArea || isLuxuryCounty) {
    tags.push('Luxury');
  }

  // Check for Commercial tag
  if (leadType === 'Commercial' || leadType === 'HOA Manager') {
    tags.push('Commercial');
  }

  // Check for Multi-Unit tag
  if (leadType === 'Property Manager' || leadType === 'Investor') {
    tags.push('Multi-Unit');
  }

  return tags;
}

/**
 * Gets display color for a tag.
 * 
 * @param tag - The lead tag
 * @returns CSS color class
 */
export function getTagColor(tag: LeadTag): string {
  switch (tag) {
    case 'Whale':
      return 'bg-majestic-gold/20 text-majestic-gold border-majestic-gold/30';
    case 'Quick-Turn':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'Luxury':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'Commercial':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'Multi-Unit':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

/**
 * Gets icon name for a tag (Lucide icon names).
 * 
 * @param tag - The lead tag
 * @returns Lucide icon name
 */
export function getTagIcon(tag: LeadTag): string {
  switch (tag) {
    case 'Whale':
      return 'Trophy';
    case 'Quick-Turn':
      return 'Zap';
    case 'Luxury':
      return 'Crown';
    case 'Commercial':
      return 'Building2';
    case 'Multi-Unit':
      return 'Home';
    default:
      return 'Tag';
  }
}

/**
 * Calculates tag-based score bonus.
 * Adds to the base lead score.
 * 
 * @param tags - Array of assigned tags
 * @returns Bonus score points
 */
export function calculateTagBonus(tags: LeadTag[]): number {
  let bonus = 0;

  // Whale leads get highest bonus
  if (tags.includes('Whale')) {
    bonus += 15;
  }

  // Luxury areas get premium
  if (tags.includes('Luxury')) {
    bonus += 10;
  }

  // Multi-unit potential for recurring business
  if (tags.includes('Multi-Unit')) {
    bonus += 8;
  }

  // Commercial projects are valuable
  if (tags.includes('Commercial')) {
    bonus += 5;
  }

  // Quick-turn is good for cash flow
  if (tags.includes('Quick-Turn')) {
    bonus += 3;
  }

  return bonus;
}

/**
 * Gets priority order for tags (for display).
 * Lower number = higher priority.
 * 
 * @param tag - The lead tag
 * @returns Priority number
 */
export function getTagPriority(tag: LeadTag): number {
  switch (tag) {
    case 'Whale':
      return 1;
    case 'Luxury':
      return 2;
    case 'Commercial':
      return 3;
    case 'Multi-Unit':
      return 4;
    case 'Quick-Turn':
      return 5;
    default:
      return 99;
  }
}

/**
 * Sorts tags by priority for consistent display.
 * 
 * @param tags - Array of tags
 * @returns Sorted array
 */
export function sortTagsByPriority(tags: LeadTag[]): LeadTag[] {
  return [...tags].sort((a, b) => getTagPriority(a) - getTagPriority(b));
}
