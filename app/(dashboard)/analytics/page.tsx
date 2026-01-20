/**
 * ===========================================
 * ANALYTICS PAGE
 * ===========================================
 * Service analytics with trends, stats,
 * and territory visualization.
 */

import { Header } from '@/components/layout/Header';
import { LeadStats } from '@/components/analytics/LeadStats';
import { ServiceTrends } from '@/components/analytics/ServiceTrends';
import { RevenueHeatmap } from '@/components/analytics/RevenueHeatmap';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MOCK_LEADS } from '@/lib/leads/mock-data';
import { ServiceTier } from '@/types/lead';
import { getTierLabel, getTierColor } from '@/lib/leads/categorization';

/**
 * Tier breakdown card.
 */
function TierBreakdown({ leads }: { leads: typeof MOCK_LEADS }) {
  const tierCounts = {
    [ServiceTier.EPIC]: leads.filter(l => l.serviceTier === ServiceTier.EPIC),
    [ServiceTier.MODERNIZE]: leads.filter(l => l.serviceTier === ServiceTier.MODERNIZE),
    [ServiceTier.EXTERIOR]: leads.filter(l => l.serviceTier === ServiceTier.EXTERIOR),
    [ServiceTier.SERVICE]: leads.filter(l => l.serviceTier === ServiceTier.SERVICE),
  };
  
  return (
    <Card className="glass p-5 border-white/10">
      <h3 className="font-semibold text-white mb-4">Lead Tiers</h3>
      
      <div className="space-y-4">
        {Object.entries(tierCounts).map(([tier, tierLeads]) => {
          const tierNum = Number(tier) as ServiceTier;
          const totalValue = tierLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
          const percentage = leads.length > 0 ? (tierLeads.length / leads.length) * 100 : 0;
          
          return (
            <div key={tier}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getTierColor(tierNum) }}
                  />
                  <span className="text-sm text-white">{getTierLabel(tierNum)}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {tierLeads.length} ({percentage.toFixed(0)}%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: getTierColor(tierNum),
                    }}
                  />
                </div>
                <span className="text-xs text-majestic-gold w-16 text-right">
                  ${(totalValue / 1000).toFixed(0)}k
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/**
 * Analytics Page.
 * Shows comprehensive lead and service analytics.
 */
export default function AnalyticsPage() {
  const activeLeads = MOCK_LEADS.filter(l => l.isVirginiaValidated && l.status === 'active');
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <Header
        title="Analytics"
        subtitle="Service trends and territory insights"
        showNewLeadButton={false}
      />
      
      {/* Key Stats */}
      <LeadStats leads={activeLeads} />
      
      {/* Service Trends */}
      <ServiceTrends leads={activeLeads} />
      
      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tier Breakdown */}
        <TierBreakdown leads={activeLeads} />
        
        {/* Revenue Heatmap */}
        <div className="lg:col-span-2">
          <RevenueHeatmap leads={activeLeads} />
        </div>
      </div>
    </div>
  );
}
