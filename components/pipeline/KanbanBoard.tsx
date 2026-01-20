/**
 * ===========================================
 * KANBAN BOARD COMPONENT
 * ===========================================
 * Full pipeline visualization with drag-and-drop.
 * Shows leads organized by pipeline stage.
 */

'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { PipelineColumn, STAGE_CONFIG } from './PipelineColumn';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { RefreshCw, Filter } from 'lucide-react';
import { type PipelineStage } from '@/types/lead';
import { type MockLead, MOCK_LEADS } from '@/lib/leads/mock-data';

/**
 * All pipeline stages in order.
 */
const PIPELINE_STAGES: PipelineStage[] = [
  'new',
  'contacted',
  'design_phase',
  'quoted',
  'closed',
];

interface KanbanBoardProps {
  initialLeads?: MockLead[];
  onLeadMove?: (leadId: string, fromStage: PipelineStage, toStage: PipelineStage) => void;
  onLeadClick?: (lead: MockLead) => void;
  className?: string;
}

/**
 * Kanban Board Component.
 * Displays the full lead nurturing pipeline.
 */
export function KanbanBoard({
  initialLeads = MOCK_LEADS,
  onLeadMove,
  onLeadClick,
  className,
}: KanbanBoardProps) {
  // Local state for leads (for drag-and-drop updates)
  const [leads, setLeads] = useState<MockLead[]>(
    initialLeads.filter(l => l.isVirginiaValidated && l.status === 'active')
  );
  
  // Dragging state
  const [draggingLead, setDraggingLead] = useState<MockLead | null>(null);
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);
  
  // Group leads by stage
  const leadsByStage = useMemo(() => {
    const grouped: Record<PipelineStage, MockLead[]> = {
      new: [],
      contacted: [],
      design_phase: [],
      quoted: [],
      closed: [],
    };
    
    leads.forEach((lead) => {
      if (grouped[lead.pipelineStage]) {
        grouped[lead.pipelineStage].push(lead);
      }
    });
    
    // Sort each stage by lead score (highest first)
    Object.keys(grouped).forEach((stage) => {
      grouped[stage as PipelineStage].sort((a, b) => b.leadScore - a.leadScore);
    });
    
    return grouped;
  }, [leads]);
  
  // Handle drag start
  const handleDragStart = (lead: MockLead) => {
    setDraggingLead(lead);
  };
  
  // Handle drag over
  const handleDragOver = (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    setDragOverStage(stage);
  };
  
  // Handle drop
  const handleDrop = (e: React.DragEvent, toStage: PipelineStage) => {
    e.preventDefault();
    
    const leadId = e.dataTransfer.getData('leadId');
    const lead = leads.find(l => l.id === leadId);
    
    if (lead && lead.pipelineStage !== toStage) {
      const fromStage = lead.pipelineStage;
      
      // Update local state
      setLeads(prev => prev.map(l => 
        l.id === leadId 
          ? { ...l, pipelineStage: toStage, updatedAt: new Date() }
          : l
      ));
      
      // Notify parent
      onLeadMove?.(leadId, fromStage, toStage);
    }
    
    setDraggingLead(null);
    setDragOverStage(null);
  };
  
  // Calculate totals
  const totalLeads = leads.length;
  const totalValue = leads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
  
  return (
    <div className={cn('space-y-4', className)}>
      {/* Board Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Lead Pipeline</h2>
          <p className="text-sm text-muted-foreground">
            {totalLeads} leads · ${(totalValue / 1000).toFixed(0)}k total value
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Kanban Columns */}
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {PIPELINE_STAGES.map((stage) => (
            <PipelineColumn
              key={stage}
              stage={stage}
              leads={leadsByStage[stage]}
              onLeadClick={onLeadClick}
              onDragStart={handleDragStart}
              onDragOver={(e) => handleDragOver(e, stage)}
              onDrop={handleDrop}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      
      {/* Drag Indicator */}
      {draggingLead && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-majestic-teal/90 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          Moving: {draggingLead.name}
          {dragOverStage && (
            <span className="ml-2 text-white/80">
              → {STAGE_CONFIG[dragOverStage].label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default KanbanBoard;
