/**
 * ===========================================
 * LEADS PAGE
 * ===========================================
 * Full lead management view with pipeline
 * and detailed lead feed.
 */

'use client';

import { Header } from '@/components/layout/Header';
import { KanbanBoard } from '@/components/pipeline/KanbanBoard';
import { StaleLeadAlert } from '@/components/pipeline/StaleLeadAlert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LeadFeed } from '@/components/leads/LeadFeed';
import { MOCK_LEADS } from '@/lib/leads/mock-data';

/**
 * Leads Management Page.
 * Shows pipeline view and lead feed.
 */
export default function LeadsPage() {
  const activeLeads = MOCK_LEADS.filter(l => l.isVirginiaValidated && l.status === 'active');
  const staleLeads = activeLeads.filter(l => l.isStale);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <Header
        title="Lead Intelligence"
        subtitle="Manage and nurture your Virginia leads"
      />
      
      {/* Stale Lead Alert */}
      {staleLeads.length > 0 && (
        <StaleLeadAlert
          leads={staleLeads}
          onContact={(id) => console.log('Contact:', id)}
          onDismiss={(id) => console.log('Dismiss:', id)}
        />
      )}
      
      {/* Main Content with Tabs */}
      <Tabs defaultValue="pipeline" className="w-full">
        <TabsList className="bg-card/50 border border-border">
          <TabsTrigger value="pipeline" className="data-[state=active]:bg-majestic-teal/20">
            Pipeline View
          </TabsTrigger>
          <TabsTrigger value="feed" className="data-[state=active]:bg-majestic-teal/20">
            Lead Feed
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pipeline" className="mt-6">
          <KanbanBoard
            initialLeads={activeLeads}
            onLeadMove={(id, from, to) => console.log('Move:', id, from, '->', to)}
            onLeadClick={(lead) => console.log('Click:', lead.name)}
          />
        </TabsContent>
        
        <TabsContent value="feed" className="mt-6">
          <LeadFeed showFilters={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
