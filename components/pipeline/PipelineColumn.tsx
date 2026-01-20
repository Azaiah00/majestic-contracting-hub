/**
 * ===========================================
 * PIPELINE COLUMN COMPONENT
 * ===========================================
 * Individual column in the Kanban board.
 * Shows leads in a specific pipeline stage.
 */

'use client';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type PipelineStage } from '@/types/lead';
import { type MockLead } from '@/lib/leads/mock-data';
import { TierDot } from '@/components/leads/ServiceBadge';
import {
  Clock,
  DollarSign,
  Phone,
  AlertTriangle,
  GripVertical,
} from 'lucide-react';

/**
 * Stage configuration with colors and labels.
 */
export const STAGE_CONFIG: Record<PipelineStage, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  new: {
    label: 'New',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
  },
  contacted: {
    label: 'Contacted',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
  },
  design_phase: {
    label: 'Design Phase',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
  },
  quoted: {
    label: 'Quoted',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
  },
  closed: {
    label: 'Closed Won',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
  },
};

interface PipelineColumnProps {
  stage: PipelineStage;
  leads: MockLead[];
  onLeadClick?: (lead: MockLead) => void;
  onDragStart?: (lead: MockLead) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, stage: PipelineStage) => void;
}

/**
 * Compact lead card for pipeline view.
 */
function PipelineLeadCard({
  lead,
  onClick,
  onDragStart,
}: {
  lead: MockLead;
  onClick?: () => void;
  onDragStart?: () => void;
}) {
  const formatValue = (val: number) => {
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
    return `$${val}`;
  };
  
  return (
    <Card
      className={cn(
        'p-3 cursor-pointer transition-all duration-200',
        'hover:border-white/20 hover:bg-white/5',
        'border border-white/10 bg-card/80',
        lead.isStale && 'border-l-2 border-l-amber-500'
      )}
      onClick={onClick}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('leadId', lead.id);
        onDragStart?.();
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0 cursor-grab" />
          <TierDot tier={lead.serviceTier} size="sm" />
          <span className="font-medium text-white text-sm truncate">
            {lead.name}
          </span>
        </div>
        {lead.isStale && (
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
        )}
      </div>
      
      {/* Service */}
      <p className="text-xs text-muted-foreground mb-2 truncate">
        {lead.serviceType}
      </p>
      
      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {lead.county || lead.location}
        </span>
        {lead.estimatedValue && (
          <span className="text-majestic-gold font-medium">
            {formatValue(lead.estimatedValue)}
          </span>
        )}
      </div>
    </Card>
  );
}

/**
 * Pipeline Column Component.
 * Displays leads in a specific stage of the pipeline.
 */
export function PipelineColumn({
  stage,
  leads,
  onLeadClick,
  onDragStart,
  onDragOver,
  onDrop,
}: PipelineColumnProps) {
  const config = STAGE_CONFIG[stage];
  const totalValue = leads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
  const staleCount = leads.filter(l => l.isStale).length;
  
  return (
    <div
      className="flex flex-col w-72 flex-shrink-0"
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver?.(e);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop?.(e, stage);
      }}
    >
      {/* Column Header */}
      <div className={cn(
        'p-3 rounded-t-lg border border-b-0 border-white/10',
        config.bgColor
      )}>
        <div className="flex items-center justify-between mb-1">
          <h3 className={cn('font-semibold', config.color)}>
            {config.label}
          </h3>
          <Badge variant="secondary" className="text-xs">
            {leads.length}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            ${(totalValue / 1000).toFixed(0)}k
          </span>
          {staleCount > 0 && (
            <span className="flex items-center gap-1 text-amber-500">
              <Clock className="w-3 h-3" />
              {staleCount} stale
            </span>
          )}
        </div>
      </div>
      
      {/* Column Body */}
      <div className="flex-1 border border-white/10 rounded-b-lg bg-card/30 min-h-[400px]">
        <ScrollArea className="h-[500px]">
          <div className="p-2 space-y-2">
            {leads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No leads in this stage
              </div>
            ) : (
              leads.map((lead) => (
                <PipelineLeadCard
                  key={lead.id}
                  lead={lead}
                  onClick={() => onLeadClick?.(lead)}
                  onDragStart={() => onDragStart?.(lead)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

export default PipelineColumn;
