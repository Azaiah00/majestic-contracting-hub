/**
 * ===========================================
 * SERVICE TRENDS COMPONENT
 * ===========================================
 * Shows trending services with charts and
 * percentage change indicators.
 */

'use client';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
} from 'lucide-react';
import { type MockLead } from '@/lib/leads/mock-data';
import { getTierColor, getTierLabel } from '@/lib/leads/categorization';
import { ServiceTier } from '@/types/lead';

interface ServiceTrendsProps {
  leads: MockLead[];
  className?: string;
}

/**
 * Mock trend data (in production, this would be calculated from historical data).
 */
const TREND_DATA: Record<string, { change: number; direction: 'up' | 'down' | 'neutral' }> = {
  'Kitchen Remodel': { change: 20, direction: 'up' },
  'Bathroom Remodel': { change: 15, direction: 'up' },
  'New Construction': { change: 8, direction: 'up' },
  'Full Renovation': { change: -5, direction: 'down' },
  'Deck': { change: 12, direction: 'up' },
  'Roofing': { change: 25, direction: 'up' },
  'Basement Remodel': { change: 0, direction: 'neutral' },
  'Home Addition': { change: -3, direction: 'down' },
  'Painting': { change: 5, direction: 'up' },
  'Flooring': { change: 10, direction: 'up' },
};

/**
 * Service trend item component.
 */
function ServiceTrendItem({
  serviceName,
  count,
  value,
  tier,
  trend,
}: {
  serviceName: string;
  count: number;
  value: number;
  tier: ServiceTier;
  trend: { change: number; direction: 'up' | 'down' | 'neutral' };
}) {
  const tierColor = getTierColor(tier);
  
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-3">
        {/* Tier indicator */}
        <div
          className="w-1 h-8 rounded-full"
          style={{ backgroundColor: tierColor }}
        />
        
        <div>
          <p className="font-medium text-white">{serviceName}</p>
          <p className="text-sm text-muted-foreground">
            {count} leads · ${(value / 1000).toFixed(0)}k value
          </p>
        </div>
      </div>
      
      {/* Trend indicator */}
      <div className={cn(
        'flex items-center gap-1 text-sm font-medium',
        trend.direction === 'up' ? 'text-green-400' :
        trend.direction === 'down' ? 'text-red-400' :
        'text-muted-foreground'
      )}>
        {trend.direction === 'up' && <TrendingUp className="w-4 h-4" />}
        {trend.direction === 'down' && <TrendingDown className="w-4 h-4" />}
        {trend.direction === 'neutral' && <Minus className="w-4 h-4" />}
        <span>
          {trend.direction === 'neutral' ? '0%' : `${trend.change > 0 ? '+' : ''}${trend.change}%`}
        </span>
      </div>
    </div>
  );
}

/**
 * Simple bar chart for service distribution.
 */
function ServiceBarChart({ data }: { data: { name: string; value: number; tier: ServiceTier }[] }) {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.name} className="flex items-center gap-3">
          <div className="w-24 text-xs text-muted-foreground truncate">
            {item.name}
          </div>
          <div className="flex-1 h-4 bg-white/5 rounded overflow-hidden">
            <div
              className="h-full rounded transition-all duration-500"
              style={{
                width: `${(item.value / maxValue) * 100}%`,
                backgroundColor: getTierColor(item.tier),
              }}
            />
          </div>
          <div className="w-8 text-xs text-muted-foreground text-right">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Service Trends Component.
 * Shows which services are trending up or down.
 */
export function ServiceTrends({ leads, className }: ServiceTrendsProps) {
  // Group leads by service type
  const serviceStats = leads.reduce((acc, lead) => {
    if (!acc[lead.serviceType]) {
      acc[lead.serviceType] = {
        count: 0,
        value: 0,
        tier: lead.serviceTier,
      };
    }
    acc[lead.serviceType].count++;
    acc[lead.serviceType].value += lead.estimatedValue || 0;
    return acc;
  }, {} as Record<string, { count: number; value: number; tier: ServiceTier }>);
  
  // Sort by count
  const sortedServices = Object.entries(serviceStats)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8);
  
  // Get top trending (highest positive change)
  const topTrending = sortedServices
    .filter(([name]) => TREND_DATA[name]?.direction === 'up')
    .sort((a, b) => (TREND_DATA[b[0]]?.change || 0) - (TREND_DATA[a[0]]?.change || 0))
    .slice(0, 3);
  
  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-2 gap-6', className)}>
      {/* Trending Services List */}
      <Card className="glass p-5 border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Service Trends</h3>
          <Badge variant="secondary" className="text-xs">
            vs. last month
          </Badge>
        </div>
        
        <div>
          {sortedServices.map(([serviceName, stats]) => (
            <ServiceTrendItem
              key={serviceName}
              serviceName={serviceName}
              count={stats.count}
              value={stats.value}
              tier={stats.tier}
              trend={TREND_DATA[serviceName] || { change: 0, direction: 'neutral' }}
            />
          ))}
        </div>
      </Card>
      
      {/* Service Distribution Chart */}
      <Card className="glass p-5 border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Lead Distribution</h3>
          <Badge variant="secondary" className="text-xs">
            By Service Type
          </Badge>
        </div>
        
        <ServiceBarChart
          data={sortedServices.map(([name, stats]) => ({
            name,
            value: stats.count,
            tier: stats.tier,
          }))}
        />
        
        {/* Top Trending Highlight */}
        {topTrending.length > 0 && (
          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-xs text-muted-foreground mb-2">TOP TRENDING</p>
            <div className="flex flex-wrap gap-2">
              {topTrending.map(([name]) => (
                <Badge
                  key={name}
                  className="bg-green-500/20 text-green-400 border-green-500/30"
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default ServiceTrends;
