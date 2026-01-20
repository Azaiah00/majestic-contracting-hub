/**
 * ===========================================
 * REVENUE HEATMAP COMPONENT
 * ===========================================
 * Virginia map visualization showing lead density
 * and project values by territory/county.
 */

'use client';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { MapPin, DollarSign, Users } from 'lucide-react';
import { type MockLead } from '@/lib/leads/mock-data';
import { VA_COUNTIES } from '@/lib/leads/validation';

interface RevenueHeatmapProps {
  leads: MockLead[];
  className?: string;
}

/**
 * County statistics for the heatmap.
 */
interface CountyStats {
  county: string;
  region: string;
  leadCount: number;
  totalValue: number;
  avgValue: number;
}

/**
 * Gets heat intensity based on value.
 */
function getHeatIntensity(value: number, maxValue: number): string {
  const ratio = value / maxValue;
  if (ratio > 0.75) return 'bg-majestic-gold';
  if (ratio > 0.5) return 'bg-orange-500';
  if (ratio > 0.25) return 'bg-majestic-teal';
  if (ratio > 0) return 'bg-majestic-teal/50';
  return 'bg-white/10';
}

/**
 * County cell in the heatmap grid.
 */
function CountyCell({
  stats,
  maxValue,
}: {
  stats: CountyStats;
  maxValue: number;
}) {
  const intensity = getHeatIntensity(stats.totalValue, maxValue);
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'p-3 rounded-lg border border-white/10 cursor-pointer transition-all',
              'hover:scale-105 hover:shadow-lg hover:z-10',
              intensity
            )}
          >
            <p className="text-xs font-medium text-white truncate">
              {stats.county}
            </p>
            <p className="text-lg font-bold text-white">
              {stats.leadCount}
            </p>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-semibold">{stats.county}, VA</p>
            <div className="text-sm space-y-1">
              <p className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                {stats.leadCount} leads
              </p>
              <p className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                ${(stats.totalValue / 1000).toFixed(0)}k total
              </p>
              <p className="text-muted-foreground">
                Avg: ${(stats.avgValue / 1000).toFixed(0)}k per lead
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Region section of the heatmap.
 */
function RegionSection({
  title,
  counties,
  countyStats,
  maxValue,
}: {
  title: string;
  counties: readonly string[];
  countyStats: Record<string, CountyStats>;
  maxValue: number;
}) {
  // Get stats for this region's counties
  const regionStats = counties
    .map(county => countyStats[county])
    .filter(Boolean)
    .sort((a, b) => b.totalValue - a.totalValue);
  
  const totalLeads = regionStats.reduce((sum, s) => sum + s.leadCount, 0);
  const totalValue = regionStats.reduce((sum, s) => sum + s.totalValue, 0);
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-white">{title}</h4>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{totalLeads} leads</span>
          <span className="text-majestic-gold">${(totalValue / 1000).toFixed(0)}k</span>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-2">
        {regionStats.map((stats) => (
          <CountyCell
            key={stats.county}
            stats={stats}
            maxValue={maxValue}
          />
        ))}
        
        {/* Empty slots for visual grid */}
        {regionStats.length < 4 && Array(4 - regionStats.length).fill(null).map((_, i) => (
          <div key={`empty-${i}`} className="p-3 rounded-lg bg-white/5 opacity-30" />
        ))}
      </div>
    </div>
  );
}

/**
 * Revenue Heatmap Component.
 * Shows lead density across Virginia territories.
 */
export function RevenueHeatmap({ leads, className }: RevenueHeatmapProps) {
  // Calculate stats by county
  const countyStats = leads.reduce((acc, lead) => {
    const county = lead.county || 'Unknown';
    if (!acc[county]) {
      acc[county] = {
        county,
        region: 'Unknown',
        leadCount: 0,
        totalValue: 0,
        avgValue: 0,
      };
    }
    acc[county].leadCount++;
    acc[county].totalValue += lead.estimatedValue || 0;
    return acc;
  }, {} as Record<string, CountyStats>);
  
  // Calculate averages
  Object.values(countyStats).forEach(stats => {
    stats.avgValue = stats.leadCount > 0 ? stats.totalValue / stats.leadCount : 0;
  });
  
  // Find max value for heat scaling
  const maxValue = Math.max(...Object.values(countyStats).map(s => s.totalValue), 1);
  
  // Calculate totals
  const totalLeads = leads.length;
  const totalValue = leads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
  
  // Top counties
  const topCounties = Object.values(countyStats)
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 5);
  
  return (
    <Card className={cn('glass border-white/10 overflow-hidden', className)}>
      {/* Header */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-majestic-teal" />
            <h3 className="font-semibold text-white">Virginia Territory Map</h3>
          </div>
          <Badge variant="secondary" className="text-xs">
            {totalLeads} leads · ${(totalValue / 1000).toFixed(0)}k
          </Badge>
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <span className="text-muted-foreground">Value:</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-white/10" />
            <span className="text-muted-foreground">Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-majestic-teal/50" />
            <span className="text-muted-foreground">Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-majestic-teal" />
            <span className="text-muted-foreground">High</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-majestic-gold" />
            <span className="text-muted-foreground">Hot</span>
          </div>
        </div>
      </div>
      
      {/* Map Content */}
      <div className="p-5 space-y-6">
        {/* Northern Virginia (Primary Market) */}
        <RegionSection
          title="Northern Virginia (Primary)"
          counties={VA_COUNTIES.northernVA}
          countyStats={countyStats}
          maxValue={maxValue}
        />
        
        {/* Richmond Metro */}
        <RegionSection
          title="Richmond Metro"
          counties={VA_COUNTIES.richmondMetro}
          countyStats={countyStats}
          maxValue={maxValue}
        />
        
        {/* Hampton Roads */}
        <RegionSection
          title="Hampton Roads"
          counties={VA_COUNTIES.hamptonRoads}
          countyStats={countyStats}
          maxValue={maxValue}
        />
      </div>
      
      {/* Top Counties Footer */}
      <div className="p-5 bg-white/5 border-t border-white/10">
        <p className="text-xs text-muted-foreground mb-3">TOP TERRITORIES</p>
        <div className="flex flex-wrap gap-2">
          {topCounties.map((stats, index) => (
            <Badge
              key={stats.county}
              variant="outline"
              className={cn(
                'text-xs',
                index === 0 && 'border-majestic-gold text-majestic-gold',
                index === 1 && 'border-gray-400 text-gray-400',
                index === 2 && 'border-amber-700 text-amber-700',
              )}
            >
              #{index + 1} {stats.county}: ${(stats.totalValue / 1000).toFixed(0)}k
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  );
}

export default RevenueHeatmap;
