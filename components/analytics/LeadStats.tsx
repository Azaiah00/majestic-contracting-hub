/**
 * ===========================================
 * LEAD STATS COMPONENT
 * ===========================================
 * Key metrics cards showing lead performance,
 * conversion rates, and pipeline health.
 */

'use client';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import {
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  Target,
  Percent,
} from 'lucide-react';
import { type MockLead } from '@/lib/leads/mock-data';
import { ServiceTier } from '@/types/lead';

interface LeadStatsProps {
  leads: MockLead[];
  className?: string;
}

/**
 * Stat card with icon and trend indicator.
 */
function StatCard({
  title,
  value,
  subValue,
  icon: Icon,
  trend,
  trendValue,
  color = 'teal',
}: {
  title: string;
  value: string | number;
  subValue?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'teal' | 'gold' | 'purple' | 'emerald';
}) {
  const colorStyles = {
    teal: 'bg-majestic-teal/20 text-majestic-teal',
    gold: 'bg-majestic-gold/20 text-majestic-gold',
    purple: 'bg-purple-500/20 text-purple-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
  };
  
  return (
    <Card className="glass p-5 border-white/10">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('p-2.5 rounded-lg', colorStyles[color])}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && trendValue && (
          <div className={cn(
            'flex items-center gap-1 text-sm',
            trend === 'up' ? 'text-green-400' :
            trend === 'down' ? 'text-red-400' :
            'text-muted-foreground'
          )}>
            {trend === 'up' && <TrendingUp className="w-4 h-4" />}
            {trend === 'down' && <TrendingDown className="w-4 h-4" />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-muted-foreground">{title}</p>
      {subValue && (
        <p className="text-xs text-muted-foreground/70 mt-1">{subValue}</p>
      )}
    </Card>
  );
}

/**
 * Lead Stats Component.
 * Displays key performance metrics.
 */
export function LeadStats({ leads, className }: LeadStatsProps) {
  // Calculate statistics
  const activeLeads = leads.filter(l => l.status === 'active' && l.isVirginiaValidated);
  const closedLeads = leads.filter(l => l.pipelineStage === 'closed');
  const totalValue = activeLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
  const closedValue = closedLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
  
  // Calculate averages
  const avgValue = activeLeads.length > 0 
    ? totalValue / activeLeads.length 
    : 0;
  const avgScore = activeLeads.length > 0
    ? activeLeads.reduce((sum, l) => sum + l.leadScore, 0) / activeLeads.length
    : 0;
    
  // Tier breakdown
  const epicCount = activeLeads.filter(l => l.serviceTier === ServiceTier.EPIC).length;
  const modernizeCount = activeLeads.filter(l => l.serviceTier === ServiceTier.MODERNIZE).length;
  
  // Stale leads
  const staleCount = activeLeads.filter(l => l.isStale).length;
  const staleRate = activeLeads.length > 0 
    ? ((staleCount / activeLeads.length) * 100).toFixed(0)
    : 0;
    
  // Conversion rate (closed / total that entered)
  const conversionRate = leads.length > 0
    ? ((closedLeads.length / leads.length) * 100).toFixed(1)
    : 0;
  
  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      <StatCard
        title="Active Leads"
        value={activeLeads.length}
        subValue={`${epicCount} whale leads`}
        icon={Users}
        trend="up"
        trendValue="+12%"
        color="teal"
      />
      
      <StatCard
        title="Pipeline Value"
        value={`$${(totalValue / 1000).toFixed(0)}k`}
        subValue={`Avg: $${(avgValue / 1000).toFixed(0)}k per lead`}
        icon={DollarSign}
        trend="up"
        trendValue="+8%"
        color="gold"
      />
      
      <StatCard
        title="Conversion Rate"
        value={`${conversionRate}%`}
        subValue={`${closedLeads.length} closed this month`}
        icon={Target}
        trend="up"
        trendValue="+3%"
        color="emerald"
      />
      
      <StatCard
        title="Avg Lead Score"
        value={avgScore.toFixed(0)}
        subValue={`${staleCount} leads need contact`}
        icon={TrendingUp}
        trend={staleCount > 2 ? 'down' : 'up'}
        trendValue={staleCount > 2 ? `${staleRate}% stale` : 'Healthy'}
        color="purple"
      />
    </div>
  );
}

export default LeadStats;
