/**
 * ===========================================
 * LEAD SCORING ALGORITHM
 * ===========================================
 * Calculates lead scores based on service tier,
 * project scope, tags, and other factors.
 * 
 * Score range: 0-100
 */

import { ServiceTier, type ProjectScope, type LeadTag } from '@/types/lead';
import { TIER_CONFIG } from './categorization';
import { calculateTagBonus } from './tagging';

/**
 * Scoring weights for different factors.
 * Adjust these to tune the scoring algorithm.
 */
const SCORING_WEIGHTS = {
  tier: 0.40,        // 40% weight on service tier
  scope: 0.25,       // 25% weight on project scope
  value: 0.20,       // 20% weight on estimated value
  location: 0.10,    // 10% weight on location (NoVA premium)
  engagement: 0.05,  // 5% weight on engagement indicators
};

/**
 * Project scope scores.
 */
const SCOPE_SCORES: Record<ProjectScope, number> = {
  small: 20,
  medium: 50,
  large: 75,
  enterprise: 100,
};

/**
 * Location premium for NoVA (primary market).
 */
const NOVA_COUNTIES = [
  'Fairfax',
  'Arlington',
  'Alexandria',
  'Loudoun',
  'Prince William',
  'Falls Church',
];

/**
 * Input for calculating lead score.
 */
export interface LeadScoreInput {
  serviceTier: ServiceTier;
  projectScope?: ProjectScope | null;
  estimatedValue?: number | null;
  county?: string | null;
  hasEmail?: boolean;
  hasPhone?: boolean;
  tags?: LeadTag[];
  confidenceScore?: number | null;
}

/**
 * Calculates the lead score based on various factors.
 * 
 * @param input - Lead scoring factors
 * @returns Score from 0-100
 */
export function calculateLeadScore(input: LeadScoreInput): number {
  const {
    serviceTier,
    projectScope,
    estimatedValue,
    county,
    hasEmail = false,
    hasPhone = false,
    tags = [],
    confidenceScore,
  } = input;

  // 1. Tier score (base score from tier configuration)
  const tierConfig = TIER_CONFIG[serviceTier];
  const tierScore = tierConfig.baseScore;

  // 2. Scope score
  let scopeScore = 50; // Default to medium if not specified
  if (projectScope) {
    scopeScore = SCOPE_SCORES[projectScope];
  }

  // 3. Value score (normalized against tier's expected range)
  let valueScore = 50; // Default to middle
  if (estimatedValue && estimatedValue > 0) {
    const { minValue, maxValue } = tierConfig;
    // Score based on where value falls in expected range
    if (estimatedValue >= maxValue) {
      valueScore = 100;
    } else if (estimatedValue <= minValue) {
      valueScore = 30;
    } else {
      // Linear interpolation
      valueScore = 30 + (70 * (estimatedValue - minValue) / (maxValue - minValue));
    }
  }

  // 4. Location score (NoVA premium)
  let locationScore = 70; // Default for general VA
  if (county) {
    const isNoVA = NOVA_COUNTIES.some(
      c => c.toLowerCase() === county.toLowerCase()
    );
    locationScore = isNoVA ? 100 : 70;
  }

  // 5. Engagement score (contact info availability)
  let engagementScore = 0;
  if (hasEmail) engagementScore += 50;
  if (hasPhone) engagementScore += 50;

  // Calculate weighted total
  let weightedScore = 
    (tierScore * SCORING_WEIGHTS.tier) +
    (scopeScore * SCORING_WEIGHTS.scope) +
    (valueScore * SCORING_WEIGHTS.value) +
    (locationScore * SCORING_WEIGHTS.location) +
    (engagementScore * SCORING_WEIGHTS.engagement);

  // 6. Add tag bonus (Whale, Luxury, Multi-Unit, etc.)
  if (tags && tags.length > 0) {
    const tagBonus = calculateTagBonus(tags);
    weightedScore += tagBonus;
  }

  // 7. Factor in AI confidence score (for Lead Finder results)
  if (confidenceScore && confidenceScore > 0) {
    // Boost score slightly for high-confidence leads
    const confidenceBonus = (confidenceScore / 100) * 5; // Max +5 points
    weightedScore += confidenceBonus;
  }

  // Round to nearest integer and clamp to 0-100
  return Math.min(100, Math.max(0, Math.round(weightedScore)));
}

/**
 * Gets a human-readable score label.
 * 
 * @param score - The numeric score
 * @returns Label like "Hot Lead", "Warm Lead", etc.
 */
export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Hot Lead';
  if (score >= 60) return 'Warm Lead';
  if (score >= 40) return 'Cool Lead';
  return 'Cold Lead';
}

/**
 * Gets the CSS color for a score.
 * 
 * @param score - The numeric score
 * @returns Tailwind color class
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-red-500';     // Hot
  if (score >= 60) return 'text-orange-500';  // Warm
  if (score >= 40) return 'text-yellow-500';  // Cool
  return 'text-blue-500';                      // Cold
}

/**
 * Gets the background color for a score badge.
 * 
 * @param score - The numeric score
 * @returns Tailwind background class
 */
export function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-red-500/20';
  if (score >= 60) return 'bg-orange-500/20';
  if (score >= 40) return 'bg-yellow-500/20';
  return 'bg-blue-500/20';
}

/**
 * Estimates project scope from estimated value.
 * 
 * @param value - Estimated project value in dollars
 * @returns Estimated project scope
 */
export function estimateScopeFromValue(value: number): ProjectScope {
  if (value >= 150000) return 'enterprise';
  if (value >= 50000) return 'large';
  if (value >= 10000) return 'medium';
  return 'small';
}

/**
 * Calculates priority rank for sorting leads.
 * Higher rank = higher priority.
 * 
 * @param score - Lead score
 * @param tier - Service tier
 * @param isStale - Whether the lead is stale (not contacted)
 * @returns Priority rank number
 */
export function calculatePriorityRank(
  score: number,
  tier: ServiceTier,
  isStale: boolean
): number {
  // Base rank from score
  let rank = score;
  
  // Tier bonus (higher tiers get priority)
  const tierBonus = (5 - tier) * 10; // Tier 1 = +40, Tier 4 = +10
  rank += tierBonus;
  
  // Stale penalty (need attention!)
  if (isStale) {
    rank += 50; // Boost stale leads to top of priority
  }
  
  return rank;
}
