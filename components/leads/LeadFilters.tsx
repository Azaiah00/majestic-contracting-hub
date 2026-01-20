/**
 * ===========================================
 * LEAD FILTERS COMPONENT
 * ===========================================
 * Filter bar for the lead feed with tier,
 * service, and status filtering options.
 */

'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Filter, SlidersHorizontal } from 'lucide-react';
import { ServiceTier, MAJESTIC_SERVICES, type PipelineStage } from '@/types/lead';
import { getTierLabel, getTierColor, TIER_CONFIG } from '@/lib/leads/categorization';

interface LeadFiltersProps {
  selectedTiers: ServiceTier[];
  selectedServices: string[];
  selectedStages: PipelineStage[];
  onTierChange: (tiers: ServiceTier[]) => void;
  onServiceChange: (services: string[]) => void;
  onStageChange: (stages: PipelineStage[]) => void;
  onClearAll: () => void;
}

/**
 * Tier filter buttons.
 */
const TIER_OPTIONS: { tier: ServiceTier; label: string }[] = [
  { tier: ServiceTier.EPIC, label: 'Epic' },
  { tier: ServiceTier.MODERNIZE, label: 'Modernize' },
  { tier: ServiceTier.EXTERIOR, label: 'Exterior' },
  { tier: ServiceTier.SERVICE, label: 'Service' },
];

/**
 * Pipeline stage options.
 */
const STAGE_OPTIONS: { value: PipelineStage; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'design_phase', label: 'Design' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'closed', label: 'Closed' },
];

/**
 * Lead Filters Component.
 * Provides tier, service, and stage filtering.
 */
export function LeadFilters({
  selectedTiers,
  selectedServices,
  selectedStages,
  onTierChange,
  onServiceChange,
  onStageChange,
  onClearAll,
}: LeadFiltersProps) {
  // Calculate total active filters
  const activeCount = selectedTiers.length + selectedServices.length + selectedStages.length;
  
  // Toggle tier selection
  const toggleTier = (tier: ServiceTier) => {
    if (selectedTiers.includes(tier)) {
      onTierChange(selectedTiers.filter(t => t !== tier));
    } else {
      onTierChange([...selectedTiers, tier]);
    }
  };
  
  // Toggle stage selection
  const toggleStage = (stage: PipelineStage) => {
    if (selectedStages.includes(stage)) {
      onStageChange(selectedStages.filter(s => s !== stage));
    } else {
      onStageChange([...selectedStages, stage]);
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-white">Filters</span>
          {activeCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeCount} active
            </Badge>
          )}
        </div>
        
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-xs text-muted-foreground hover:text-white"
          >
            <X className="w-3 h-3 mr-1" />
            Clear all
          </Button>
        )}
      </div>
      
      {/* Tier Filters */}
      <div>
        <label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
          Service Tier
        </label>
        <div className="flex flex-wrap gap-2">
          {TIER_OPTIONS.map(({ tier, label }) => {
            const isSelected = selectedTiers.includes(tier);
            const color = getTierColor(tier);
            
            return (
              <button
                key={tier}
                onClick={() => toggleTier(tier)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                  'border border-white/10 hover:border-white/20',
                  isSelected
                    ? 'bg-white/10 text-white'
                    : 'bg-transparent text-muted-foreground'
                )}
                style={{
                  borderColor: isSelected ? color : undefined,
                  color: isSelected ? color : undefined,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full inline-block mr-2"
                  style={{ backgroundColor: color }}
                />
                {label}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Pipeline Stage Filters */}
      <div>
        <label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
          Pipeline Stage
        </label>
        <div className="flex flex-wrap gap-2">
          {STAGE_OPTIONS.map(({ value, label }) => {
            const isSelected = selectedStages.includes(value);
            
            return (
              <button
                key={value}
                onClick={() => toggleStage(value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                  'border border-white/10 hover:border-white/20',
                  isSelected
                    ? 'bg-majestic-teal/20 text-majestic-teal border-majestic-teal/50'
                    : 'bg-transparent text-muted-foreground'
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Service Type Quick Select */}
      <div>
        <label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
          Quick Service Select
        </label>
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
          {/* Epic services */}
          {MAJESTIC_SERVICES.tier1.map(service => (
            <Badge
              key={service}
              variant="outline"
              className={cn(
                'cursor-pointer text-xs',
                selectedServices.includes(service)
                  ? 'bg-tier-epic/20 text-tier-epic border-tier-epic/50'
                  : 'hover:bg-white/5'
              )}
              onClick={() => {
                if (selectedServices.includes(service)) {
                  onServiceChange(selectedServices.filter(s => s !== service));
                } else {
                  onServiceChange([...selectedServices, service]);
                }
              }}
            >
              {service}
            </Badge>
          ))}
          
          {/* Modernize services */}
          {MAJESTIC_SERVICES.tier2.map(service => (
            <Badge
              key={service}
              variant="outline"
              className={cn(
                'cursor-pointer text-xs',
                selectedServices.includes(service)
                  ? 'bg-tier-modernize/20 text-tier-modernize border-tier-modernize/50'
                  : 'hover:bg-white/5'
              )}
              onClick={() => {
                if (selectedServices.includes(service)) {
                  onServiceChange(selectedServices.filter(s => s !== service));
                } else {
                  onServiceChange([...selectedServices, service]);
                }
              }}
            >
              {service}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LeadFilters;
