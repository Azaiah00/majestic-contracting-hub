/**
 * ===========================================
 * STALE LEAD ALERT COMPONENT
 * ===========================================
 * Highlights leads that haven't been contacted
 * within 24 hours. Shows urgency indicators.
 */

'use client';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  Clock,
  Phone,
  ArrowRight,
  X,
} from 'lucide-react';
import { type MockLead } from '@/lib/leads/mock-data';
import { TierDot } from '@/components/leads/ServiceBadge';

interface StaleLeadAlertProps {
  leads: MockLead[];
  onContact?: (leadId: string) => void;
  onDismiss?: (leadId: string) => void;
  onViewAll?: () => void;
  maxDisplay?: number;
  className?: string;
}

/**
 * Calculates hours since last contact or creation.
 */
function getHoursSinceContact(lead: MockLead): number {
  const lastDate = lead.lastContactedAt || lead.createdAt;
  const now = new Date();
  const diffMs = now.getTime() - new Date(lastDate).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60));
}

/**
 * Gets urgency level based on hours without contact.
 */
function getUrgencyLevel(hours: number): 'critical' | 'warning' | 'normal' {
  if (hours >= 48) return 'critical';
  if (hours >= 24) return 'warning';
  return 'normal';
}

/**
 * Stale Lead Alert Component.
 * Shows a prominent alert for leads needing attention.
 */
export function StaleLeadAlert({
  leads,
  onContact,
  onDismiss,
  onViewAll,
  maxDisplay = 3,
  className,
}: StaleLeadAlertProps) {
  // Filter to only stale leads and sort by urgency
  const staleLeads = leads
    .filter(l => l.isStale)
    .sort((a, b) => getHoursSinceContact(b) - getHoursSinceContact(a))
    .slice(0, maxDisplay);
  
  if (staleLeads.length === 0) {
    return null;
  }
  
  const totalStale = leads.filter(l => l.isStale).length;
  
  return (
    <Card className={cn(
      'border-amber-500/50 bg-amber-500/10 overflow-hidden',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-amber-500/20 bg-amber-500/5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <span className="font-semibold text-amber-500">
            Action Required
          </span>
          <Badge variant="secondary" className="bg-amber-500/20 text-amber-400">
            {totalStale} leads
          </Badge>
        </div>
        
        {totalStale > maxDisplay && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewAll}
            className="text-amber-400 hover:text-amber-300"
          >
            View All
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
      
      {/* Lead List */}
      <div className="divide-y divide-amber-500/10">
        {staleLeads.map((lead) => {
          const hours = getHoursSinceContact(lead);
          const urgency = getUrgencyLevel(hours);
          
          return (
            <div
              key={lead.id}
              className="flex items-center justify-between px-4 py-3 hover:bg-amber-500/5 transition-colors"
            >
              {/* Lead Info */}
              <div className="flex items-center gap-3 min-w-0">
                <TierDot tier={lead.serviceTier} />
                <div className="min-w-0">
                  <p className="font-medium text-white truncate">
                    {lead.name}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {lead.serviceType} · {lead.county || lead.location}
                  </p>
                </div>
              </div>
              
              {/* Time Indicator */}
              <div className="flex items-center gap-3">
                <div className={cn(
                  'flex items-center gap-1 text-sm',
                  urgency === 'critical' ? 'text-red-400' :
                  urgency === 'warning' ? 'text-amber-400' :
                  'text-muted-foreground'
                )}>
                  <Clock className="w-4 h-4" />
                  <span>{hours}h</span>
                </div>
                
                {/* Actions */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-majestic-teal hover:bg-majestic-teal/10"
                  onClick={() => onContact?.(lead.id)}
                >
                  <Phone className="w-4 h-4 mr-1" />
                  Contact
                </Button>
                
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-white"
                  onClick={() => onDismiss?.(lead.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Footer */}
      {totalStale > 0 && (
        <div className="px-4 py-2 bg-amber-500/5 text-xs text-amber-400/80">
          <Clock className="w-3 h-3 inline mr-1" />
          Leads without contact in 24+ hours are marked as stale
        </div>
      )}
    </Card>
  );
}

export default StaleLeadAlert;
