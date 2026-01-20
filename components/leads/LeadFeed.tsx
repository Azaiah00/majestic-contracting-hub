/**
 * ===========================================
 * LEAD FEED COMPONENT
 * ===========================================
 * Real-time stream of incoming leads with
 * filtering, sorting, and pagination.
 */

'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { LeadCard } from './LeadCard';
import { LeadFilters } from './LeadFilters';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowUpDown,
  Grid3X3,
  List,
  AlertCircle,
} from 'lucide-react';
import { ServiceTier, type PipelineStage } from '@/types/lead';
import { type MockLead, filterMockLeads, MOCK_LEADS } from '@/lib/leads/mock-data';

type SortOption = 'score' | 'createdAt' | 'estimatedValue';
type ViewMode = 'grid' | 'list';

interface LeadFeedProps {
  initialLeads?: MockLead[];
  showFilters?: boolean;
  showStaleOnly?: boolean;
  maxItems?: number;
  className?: string;
}

/**
 * Lead Feed Component.
 * Displays a filterable, sortable list of leads.
 */
export function LeadFeed({
  initialLeads = MOCK_LEADS,
  showFilters = true,
  showStaleOnly = false,
  maxItems,
  className,
}: LeadFeedProps) {
  // Filter state
  const [selectedTiers, setSelectedTiers] = useState<ServiceTier[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedStages, setSelectedStages] = useState<PipelineStage[]>([]);
  
  // Sort and view state
  const [sortBy, setSortBy] = useState<SortOption>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  // Filter and sort leads
  const filteredLeads = useMemo(() => {
    let leads = filterMockLeads({
      tiers: selectedTiers.length > 0 ? selectedTiers : undefined,
      services: selectedServices.length > 0 ? selectedServices : undefined,
      stages: selectedStages.length > 0 ? selectedStages : undefined,
      isStale: showStaleOnly ? true : undefined,
      isVAOnly: true, // Always filter for VA only
    });
    
    // Sort leads
    leads.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'score':
          comparison = a.leadScore - b.leadScore;
          break;
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'estimatedValue':
          comparison = (a.estimatedValue || 0) - (b.estimatedValue || 0);
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    // Apply max items limit
    if (maxItems) {
      leads = leads.slice(0, maxItems);
    }
    
    return leads;
  }, [initialLeads, selectedTiers, selectedServices, selectedStages, sortBy, sortOrder, showStaleOnly, maxItems]);
  
  // Clear all filters
  const handleClearFilters = () => {
    setSelectedTiers([]);
    setSelectedServices([]);
    setSelectedStages([]);
  };
  
  // Toggle sort order
  const toggleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortOrder('desc');
    }
  };
  
  // Count stats
  const staleCount = filteredLeads.filter(l => l.isStale).length;
  const totalValue = filteredLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
  
  return (
    <div className={cn('space-y-6', className)}>
      {/* Stats Bar */}
      <div className="flex items-center justify-between bg-card/50 rounded-lg p-4 border border-border">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-2xl font-bold text-white">{filteredLeads.length}</p>
            <p className="text-sm text-muted-foreground">Active Leads</p>
          </div>
          <div className="w-px h-10 bg-border" />
          <div>
            <p className="text-2xl font-bold text-majestic-gold">
              ${(totalValue / 1000).toFixed(0)}k
            </p>
            <p className="text-sm text-muted-foreground">Pipeline Value</p>
          </div>
          {staleCount > 0 && (
            <>
              <div className="w-px h-10 bg-border" />
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold text-amber-500">{staleCount}</p>
                  <p className="text-sm text-muted-foreground">Need Contact</p>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* View Controls */}
        <div className="flex items-center gap-2">
          {/* Sort Buttons */}
          <div className="flex items-center gap-1 mr-4">
            <Button
              variant={sortBy === 'score' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => toggleSort('score')}
              className="text-xs"
            >
              Score
              <ArrowUpDown className="w-3 h-3 ml-1" />
            </Button>
            <Button
              variant={sortBy === 'createdAt' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => toggleSort('createdAt')}
              className="text-xs"
            >
              Date
              <ArrowUpDown className="w-3 h-3 ml-1" />
            </Button>
            <Button
              variant={sortBy === 'estimatedValue' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => toggleSort('estimatedValue')}
              className="text-xs"
            >
              Value
              <ArrowUpDown className="w-3 h-3 ml-1" />
            </Button>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center border border-border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-r-none"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-l-none"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex gap-6">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="w-64 flex-shrink-0">
            <div className="glass rounded-lg p-4 sticky top-20">
              <LeadFilters
                selectedTiers={selectedTiers}
                selectedServices={selectedServices}
                selectedStages={selectedStages}
                onTierChange={setSelectedTiers}
                onServiceChange={setSelectedServices}
                onStageChange={setSelectedStages}
                onClearAll={handleClearFilters}
              />
            </div>
          </div>
        )}
        
        {/* Lead Cards */}
        <div className="flex-1">
          {filteredLeads.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                No leads found
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your filters to see more results.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={handleClearFilters}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-1 lg:grid-cols-2 gap-4'
                : 'space-y-4'
            )}>
              {filteredLeads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  compact={viewMode === 'list'}
                  onContact={(id) => console.log('Contact:', id)}
                  onViewProfile={(id) => console.log('View:', id)}
                  onMoveStage={(id, stage) => console.log('Move:', id, stage)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LeadFeed;
