/**
 * ===========================================
 * LEAD FINDER PAGE
 * ===========================================
 * AI-powered lead discovery interface.
 * Uses Gemini with Google Search to find leads in Virginia.
 */

import { LeadFinder } from '@/components/leads/LeadFinder';
import { Header } from '@/components/layout/Header';

export const metadata = {
  title: 'Lead Finder | Majestic Command Center',
  description: 'AI-powered lead discovery for Virginia contractors',
};

export default function LeadFinderPage() {
  return (
    <div className="flex flex-col h-full">
      <Header 
        title="Lead Finder" 
        subtitle="AI-powered lead discovery for Virginia"
        showNewLeadButton={false}
      />
      
      <main className="flex-1 overflow-y-auto p-6">
        <LeadFinder />
      </main>
    </div>
  );
}
