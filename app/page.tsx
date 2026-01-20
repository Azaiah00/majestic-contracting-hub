/**
 * ===========================================
 * DASHBOARD HOME PAGE
 * ===========================================
 * Main dashboard view with lead overview,
 * quick stats, and recent activity.
 */

import { Header } from '@/components/layout/Header';
import { LeadFeed } from '@/components/leads/LeadFeed';
import { Card } from '@/components/ui/card';
import {
  Users,
  TrendingUp,
  DollarSign,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { MOCK_LEADS } from '@/lib/leads/mock-data';
import { ServiceTier } from '@/types/lead';

/**
 * Quick stat card component.
 */
function StatCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
}: {
  title: string;
  value: string;
  change: string;
  changeType: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
}) {
  return (
    <Card className="glass p-6 border-white/10">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <div className="p-3 rounded-lg bg-majestic-teal/20">
          <Icon className="w-5 h-5 text-majestic-teal" />
        </div>
      </div>
      <div className="flex items-center gap-1 mt-3">
        {changeType === 'up' && (
          <ArrowUpRight className="w-4 h-4 text-green-500" />
        )}
        {changeType === 'down' && (
          <ArrowDownRight className="w-4 h-4 text-red-500" />
        )}
        <span
          className={`text-sm ${
            changeType === 'up'
              ? 'text-green-500'
              : changeType === 'down'
              ? 'text-red-500'
              : 'text-muted-foreground'
          }`}
        >
          {change}
        </span>
        <span className="text-sm text-muted-foreground">vs last month</span>
      </div>
    </Card>
  );
}

/**
 * Dashboard Home Page.
 * Shows overview stats and recent leads.
 */
export default function DashboardPage() {
  // Calculate stats from mock data
  const activeLeads = MOCK_LEADS.filter(l => l.status === 'active' && l.isVirginiaValidated);
  const staleLeads = activeLeads.filter(l => l.isStale);
  const totalValue = activeLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
  const epicLeads = activeLeads.filter(l => l.serviceTier === ServiceTier.EPIC);
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <Header
        title="Command Center"
        subtitle="Majestic Lead Intelligence Hub"
      />
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Leads"
          value={activeLeads.length.toString()}
          change="+12%"
          changeType="up"
          icon={Users}
        />
        <StatCard
          title="Pipeline Value"
          value={`$${(totalValue / 1000).toFixed(0)}k`}
          change="+8%"
          changeType="up"
          icon={DollarSign}
        />
        <StatCard
          title="Whale Leads"
          value={epicLeads.length.toString()}
          change="+2"
          changeType="up"
          icon={TrendingUp}
        />
        <StatCard
          title="Need Contact"
          value={staleLeads.length.toString()}
          change="Action needed"
          changeType="neutral"
          icon={Clock}
        />
      </div>
      
      {/* Priority Section - Stale Leads */}
      {staleLeads.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="text-lg font-semibold text-white">
              Priority: Needs Contact ({staleLeads.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {staleLeads.slice(0, 3).map((lead) => (
              <Card key={lead.id} className="glass border-l-2 border-l-amber-500 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-white">{lead.name}</p>
                    <p className="text-sm text-muted-foreground">{lead.serviceType}</p>
                    <p className="text-sm text-muted-foreground">{lead.county}, VA</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-majestic-gold">
                      ${((lead.estimatedValue || 0) / 1000).toFixed(0)}k
                    </p>
                    <p className="text-xs text-amber-500">24h+ no contact</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {/* Main Lead Feed */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">
          Recent Leads
        </h2>
        <LeadFeed
          showFilters={true}
          maxItems={10}
        />
      </div>
    </div>
  );
}
