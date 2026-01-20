/**
 * ===========================================
 * LEAD FINDER COMPONENT
 * ===========================================
 * AI-powered lead discovery tool using Gemini
 * with Google Search to find leads in Virginia.
 * 
 * Features:
 * - City selection (Virginia cities)
 * - Service category selection (17 Majestic services)
 * - Lead count slider
 * - Results display with tags and scoring
 * - Save to Supabase functionality
 */

'use client';

import React, { useState, useCallback } from 'react';
import { 
  Search, 
  Loader2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Building2,
  CheckCircle,
  AlertCircle,
  Save,
  Sparkles,
  Trophy,
  Zap,
  Crown,
  Home,
  RefreshCw,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { getSupabaseClient } from '@/lib/supabase/client';
import { ALL_SERVICES, type ServiceType } from '@/types/lead';
import { getTagColor, type LeadTag } from '@/lib/leads/tagging';

/**
 * Virginia cities for dropdown selection.
 */
const VA_CITIES = [
  // NoVA (Primary Market)
  'Fairfax', 'Arlington', 'Alexandria', 'McLean', 'Great Falls', 'Vienna',
  'Reston', 'Herndon', 'Falls Church', 'Tysons', 'Ashburn', 'Leesburg',
  'Sterling', 'Centreville', 'Chantilly', 'Annandale', 'Springfield',
  'Burke', 'Lorton', 'Woodbridge', 'Manassas', 'Gainesville',
  // Richmond Metro
  'Richmond', 'Henrico', 'Chesterfield', 'Midlothian', 'Glen Allen',
  'Short Pump', 'Mechanicsville',
  // Hampton Roads
  'Virginia Beach', 'Norfolk', 'Newport News', 'Hampton', 'Chesapeake',
  // Central VA
  'Charlottesville', 'Lynchburg', 'Roanoke',
  // Other
  'Fredericksburg', 'Stafford', 'Winchester',
].sort();

/**
 * Interface for found lead from API.
 */
interface FoundLead {
  name: string;
  leadType: string;
  serviceNeed: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string;
  zipCode: string;
  website: string | null;
  company: string | null;
  confidenceScore: number;
  county: string | null;
  serviceType: string;
  serviceTier: number;
  tags: LeadTag[];
  leadScore: number;
  isDuplicate: boolean;
  state: string;
}

/**
 * Props for LeadFinder component.
 */
interface LeadFinderProps {
  onLeadsSaved?: () => void;
  className?: string;
}

/**
 * Tag icon component.
 */
function TagIcon({ tag }: { tag: LeadTag }) {
  switch (tag) {
    case 'Whale':
      return <Trophy className="w-3 h-3" />;
    case 'Quick-Turn':
      return <Zap className="w-3 h-3" />;
    case 'Luxury':
      return <Crown className="w-3 h-3" />;
    case 'Multi-Unit':
      return <Home className="w-3 h-3" />;
    case 'Commercial':
      return <Building2 className="w-3 h-3" />;
    default:
      return null;
  }
}

/**
 * Lead type badge colors.
 */
function getLeadTypeBadge(type: string): string {
  switch (type) {
    case 'Investor':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'Property Manager':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'HOA Manager':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'Commercial':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

/**
 * Found Lead Card component.
 */
function FoundLeadCard({
  lead,
  isSelected,
  onSelect,
  onSave,
  isSaving,
}: {
  lead: FoundLead;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onSave: () => void;
  isSaving: boolean;
}) {
  return (
    <Card className={cn(
      'glass border-white/10 transition-all duration-200',
      isSelected && 'border-majestic-teal ring-1 ring-majestic-teal/50',
      lead.isDuplicate && 'opacity-60'
    )}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              disabled={lead.isDuplicate}
              className="mt-1"
            />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-white">
                  {lead.name}
                </h4>
                {lead.isDuplicate && (
                  <Badge variant="outline" className="text-xs text-amber-400 border-amber-400/30">
                    Duplicate
                  </Badge>
                )}
              </div>
              {lead.company && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {lead.company}
                </p>
              )}
            </div>
          </div>
          
          {/* Confidence Score */}
          <div className="flex flex-col items-end">
            <div className={cn(
              'text-lg font-bold',
              lead.confidenceScore >= 70 ? 'text-green-400' :
              lead.confidenceScore >= 40 ? 'text-yellow-400' : 'text-red-400'
            )}>
              {lead.confidenceScore}%
            </div>
            <span className="text-xs text-muted-foreground">confidence</span>
          </div>
        </div>

        {/* Lead Type & Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge 
            variant="outline" 
            className={cn('text-xs', getLeadTypeBadge(lead.leadType))}
          >
            {lead.leadType}
          </Badge>
          {lead.tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className={cn('text-xs flex items-center gap-1', getTagColor(tag))}
            >
              <TagIcon tag={tag} />
              {tag}
            </Badge>
          ))}
        </div>

        {/* Service Need */}
        {lead.serviceNeed && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {lead.serviceNeed}
          </p>
        )}

        {/* Contact Info */}
        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">{lead.city}, VA {lead.zipCode}</span>
          </div>
          
          {lead.phone && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Phone className="w-3.5 h-3.5" />
              <span className="truncate">{lead.phone}</span>
            </div>
          )}
          
          {lead.email && (
            <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
              <Mail className="w-3.5 h-3.5" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
          
          {lead.website && (
            <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
              <Globe className="w-3.5 h-3.5" />
              <a 
                href={lead.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="truncate hover:text-majestic-teal transition-colors"
              >
                {lead.website}
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Score: {lead.leadScore}
            </Badge>
            <Badge variant="secondary" className="text-xs capitalize">
              {lead.serviceType}
            </Badge>
          </div>
          
          {!lead.isDuplicate && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onSave}
              disabled={isSaving}
              className="text-majestic-teal hover:bg-majestic-teal/10"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Main Lead Finder Component.
 */
export function LeadFinder({ onLeadsSaved, className }: LeadFinderProps) {
  // Form state
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [leadCount, setLeadCount] = useState<number>(10);
  
  // Results state
  const [results, setResults] = useState<FoundLead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set());
  
  // Loading states
  const [isSearching, setIsSearching] = useState(false);
  const [savingLeads, setSavingLeads] = useState<Set<number>>(new Set());
  const [isSavingAll, setIsSavingAll] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Supabase client
  const supabase = getSupabaseClient();

  /**
   * Handle search submission.
   */
  const handleSearch = useCallback(async () => {
    if (!selectedCity || !selectedCategory) {
      setError('Please select a city and service category');
      return;
    }

    setIsSearching(true);
    setError(null);
    setSuccessMessage(null);
    setResults([]);
    setSelectedLeads(new Set());

    try {
      const response = await fetch('/api/leads/find', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: selectedCity,
          category: selectedCategory,
          leadCount,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Search failed');
      }

      const data = await response.json();
      setResults(data.leads || []);
      
      if (data.leads?.length === 0) {
        setError('No leads found. Try a different city or category.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during search');
    } finally {
      setIsSearching(false);
    }
  }, [selectedCity, selectedCategory, leadCount]);

  /**
   * Save a single lead to Supabase.
   */
  const saveLead = useCallback(async (lead: FoundLead, index: number) => {
    if (!supabase || lead.isDuplicate) return;

    setSavingLeads(prev => new Set(prev).add(index));

    try {
      const { error: insertError } = await (supabase.from('leads') as any).insert({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        location: lead.city,
        zip_code: lead.zipCode,
        county: lead.county,
        state: 'VA',
        address: lead.address,
        service_type: lead.serviceType,
        service_tier: lead.serviceTier,
        lead_score: lead.leadScore,
        pipeline_stage: 'new',
        status: 'active',
        lead_type: lead.leadType,
        company: lead.company,
        website: lead.website,
        tags: lead.tags,
        confidence_score: lead.confidenceScore,
        service_need: lead.serviceNeed,
        discovered_at: new Date().toISOString(),
      });

      if (insertError) throw insertError;

      // Mark as duplicate in results to prevent re-saving
      setResults(prev => prev.map((l, i) => 
        i === index ? { ...l, isDuplicate: true } : l
      ));
      
      // Remove from selection
      setSelectedLeads(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });

      setSuccessMessage(`Saved: ${lead.name}`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      onLeadsSaved?.();
    } catch (err: any) {
      setError(`Failed to save ${lead.name}: ${err.message}`);
    } finally {
      setSavingLeads(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  }, [supabase, onLeadsSaved]);

  /**
   * Save all selected leads.
   */
  const saveSelectedLeads = useCallback(async () => {
    if (selectedLeads.size === 0) return;

    setIsSavingAll(true);
    setError(null);

    const leadsToSave = Array.from(selectedLeads)
      .map(i => results[i])
      .filter(l => !l.isDuplicate);

    let savedCount = 0;

    for (const lead of leadsToSave) {
      const index = results.findIndex(l => l.name === lead.name && l.email === lead.email);
      if (index !== -1) {
        await saveLead(lead, index);
        savedCount++;
      }
    }

    setIsSavingAll(false);
    setSuccessMessage(`Saved ${savedCount} leads successfully!`);
    setTimeout(() => setSuccessMessage(null), 3000);
  }, [selectedLeads, results, saveLead]);

  /**
   * Toggle lead selection.
   */
  const toggleLeadSelection = useCallback((index: number, selected: boolean) => {
    setSelectedLeads(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(index);
      } else {
        next.delete(index);
      }
      return next;
    });
  }, []);

  /**
   * Select all non-duplicate leads.
   */
  const selectAll = useCallback(() => {
    const nonDuplicates = results
      .map((l, i) => ({ lead: l, index: i }))
      .filter(({ lead }) => !lead.isDuplicate)
      .map(({ index }) => index);
    setSelectedLeads(new Set(nonDuplicates));
  }, [results]);

  /**
   * Clear selection.
   */
  const clearSelection = useCallback(() => {
    setSelectedLeads(new Set());
  }, []);

  // Count non-duplicate results
  const validResults = results.filter(l => !l.isDuplicate);
  const duplicateCount = results.length - validResults.length;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Search Form */}
      <Card className="glass border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="w-5 h-5 text-majestic-teal" />
            AI Lead Finder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* City Selection */}
            <div className="space-y-2">
              <Label htmlFor="city">Virginia City</Label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger id="city">
                  <SelectValue placeholder="Select city..." />
                </SelectTrigger>
                <SelectContent>
                  {VA_CITIES.map(city => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Service Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Service Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select service..." />
                </SelectTrigger>
                <SelectContent>
                  {ALL_SERVICES.map(service => (
                    <SelectItem key={service} value={service}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lead Count */}
            <div className="space-y-2">
              <Label>Lead Count: {leadCount}</Label>
              <Slider
                value={[leadCount]}
                onValueChange={([value]) => setLeadCount(value)}
                min={5}
                max={20}
                step={1}
                className="mt-3"
              />
            </div>
          </div>

          {/* Search Button */}
          <div className="flex items-center gap-4">
            <Button
              onClick={handleSearch}
              disabled={isSearching || !selectedCity || !selectedCategory}
              className="bg-majestic-teal hover:bg-majestic-teal/80"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Find Leads
                </>
              )}
            </Button>

            {results.length > 0 && (
              <Button
                variant="outline"
                onClick={handleSearch}
                disabled={isSearching}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Search Again
              </Button>
            )}
          </div>

          {/* Messages */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              {successMessage}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-white">
                Found {results.length} Leads
                {duplicateCount > 0 && (
                  <span className="text-muted-foreground text-sm ml-2">
                    ({duplicateCount} duplicates)
                  </span>
                )}
              </h3>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAll}
                  className="text-muted-foreground hover:text-white"
                >
                  Select All ({validResults.length})
                </Button>
                {selectedLeads.size > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    className="text-muted-foreground hover:text-white"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Save Selected Button */}
            {selectedLeads.size > 0 && (
              <Button
                onClick={saveSelectedLeads}
                disabled={isSavingAll}
                className="bg-majestic-gold hover:bg-majestic-gold/80 text-black"
              >
                {isSavingAll ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Selected ({selectedLeads.size})
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Lead Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {results.map((lead, index) => (
              <FoundLeadCard
                key={`${lead.name}-${lead.email}-${index}`}
                lead={lead}
                isSelected={selectedLeads.has(index)}
                onSelect={(selected) => toggleLeadSelection(index, selected)}
                onSave={() => saveLead(lead, index)}
                isSaving={savingLeads.has(index)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isSearching && results.length === 0 && (
        <Card className="glass border-white/10">
          <CardContent className="py-12 text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Find New Leads with AI
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Select a Virginia city and service category above, then click 
              "Find Leads" to discover potential customers using AI-powered search.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default LeadFinder;
