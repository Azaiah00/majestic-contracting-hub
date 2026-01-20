/**
 * ===========================================
 * SERVICE BADGE COMPONENT
 * ===========================================
 * Displays service type with tier-colored styling.
 * Visual indicator for lead categorization.
 */

import { cn } from '@/lib/utils';
import { ServiceTier } from '@/types/lead';
import { getTierColor, getTierLabel } from '@/lib/leads/categorization';

interface ServiceBadgeProps {
  serviceType: string;
  tier: ServiceTier;
  size?: 'sm' | 'md' | 'lg';
  showTierLabel?: boolean;
  className?: string;
}

/**
 * Tier color configurations for badges.
 * Maps tier to Tailwind classes for consistent styling.
 */
const TIER_STYLES: Record<ServiceTier, { bg: string; text: string; border: string }> = {
  [ServiceTier.EPIC]: {
    bg: 'bg-tier-epic/20',
    text: 'text-tier-epic',
    border: 'border-tier-epic/50',
  },
  [ServiceTier.MODERNIZE]: {
    bg: 'bg-tier-modernize/20',
    text: 'text-tier-modernize',
    border: 'border-tier-modernize/50',
  },
  [ServiceTier.EXTERIOR]: {
    bg: 'bg-tier-exterior/20',
    text: 'text-tier-exterior',
    border: 'border-tier-exterior/50',
  },
  [ServiceTier.SERVICE]: {
    bg: 'bg-tier-service/20',
    text: 'text-tier-service',
    border: 'border-tier-service/50',
  },
};

/**
 * Size configurations for badges.
 */
const SIZE_STYLES = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

/**
 * Service Badge Component.
 * Displays the service type with color coding based on tier.
 */
export function ServiceBadge({
  serviceType,
  tier,
  size = 'md',
  showTierLabel = false,
  className,
}: ServiceBadgeProps) {
  const styles = TIER_STYLES[tier];
  const tierLabel = getTierLabel(tier);
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Service type badge */}
      <span
        className={cn(
          'inline-flex items-center rounded-full font-medium border',
          styles.bg,
          styles.text,
          styles.border,
          SIZE_STYLES[size]
        )}
      >
        {serviceType}
      </span>
      
      {/* Optional tier label */}
      {showTierLabel && (
        <span
          className={cn(
            'text-xs uppercase tracking-wider',
            styles.text
          )}
        >
          {tierLabel}
        </span>
      )}
    </div>
  );
}

/**
 * Tier indicator dot.
 * Small colored dot for compact displays.
 */
export function TierDot({
  tier,
  size = 'md',
  className,
}: {
  tier: ServiceTier;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const color = getTierColor(tier);
  
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };
  
  return (
    <span
      className={cn(
        'rounded-full inline-block',
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: color }}
      title={getTierLabel(tier)}
    />
  );
}

export default ServiceBadge;
