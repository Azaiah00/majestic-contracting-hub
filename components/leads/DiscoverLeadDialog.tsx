/**
 * ===========================================
 * DISCOVER LEAD DIALOG - AI Lead Generation
 * ===========================================
 * Uses Google Gemini AI to extract lead information
 * from raw text input (emails, inquiries, etc.)
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { 
  Sparkles, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  MapPin,
  User,
  Mail,
  Phone,
  Wrench,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { getServiceTier, findClosestService } from '@/lib/leads/categorization';
import { isVirginiaZipCode, getCountyFromZip } from '@/lib/leads/validation';
import { calculateLeadScore } from '@/lib/leads/scoring';
import type { ServiceType } from '@/types/lead';

interface ExtractedLead {
  name: string;
  email?: string;
  phone?: string;
  location: string;
  zip_code: string;
  service_type: string;
  project_scope?: string;
  estimated_value?: number;
}

interface DiscoverLeadDialogProps {
  onLeadAdded?: () => void;
}

export function DiscoverLeadDialog({ onLeadAdded }: DiscoverLeadDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'input' | 'review' | 'success'>('input');
  
  // Raw text input
  const [rawText, setRawText] = useState('');
  
  // Extracted lead data
  const [extractedLead, setExtractedLead] = useState<ExtractedLead | null>(null);

  // Check if zip is VA
  const isVA = extractedLead?.zip_code 
    ? isVirginiaZipCode(extractedLead.zip_code) 
    : false;
  const county = extractedLead?.zip_code 
    ? getCountyFromZip(extractedLead.zip_code) 
    : null;

  // Reset dialog
  const resetDialog = () => {
    setStep('input');
    setRawText('');
    setExtractedLead(null);
    setError(null);
  };

  // Extract lead data using Gemini AI
  const handleExtract = async () => {
    if (!rawText.trim()) {
      setError('Please enter some text to analyze');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call our API route that uses Gemini
      const response = await fetch('/api/leads/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract lead data');
      }

      const data = await response.json();
      setExtractedLead(data);
      setStep('review');

    } catch (err: any) {
      console.error('Error extracting lead:', err);
      setError(err.message || 'Failed to extract lead information');
    } finally {
      setLoading(false);
    }
  };

  // Save the extracted lead to Supabase
  const handleSave = async () => {
    if (!extractedLead) return;

    setLoading(true);
    setError(null);

    try {
      if (!supabase) {
        throw new Error('Database not configured');
      }

      // Find the closest matching service type
      const matchedService = findClosestService(extractedLead.service_type);
      const serviceType = matchedService || extractedLead.service_type;
      const serviceTier = matchedService 
        ? getServiceTier(matchedService) 
        : 4;

      // Calculate lead score
      const leadScore = calculateLeadScore({
        serviceTier: serviceTier,
        estimatedValue: extractedLead.estimated_value,
        hasEmail: !!extractedLead.email,
        hasPhone: !!extractedLead.phone,
        county: county,
      });

      // Prepare lead data
      const leadData = {
        name: extractedLead.name,
        email: extractedLead.email || null,
        phone: extractedLead.phone || null,
        location: extractedLead.location,
        zip_code: extractedLead.zip_code,
        county: county,
        state: isVA ? 'VA' : null,
        service_type: serviceType,
        service_tier: serviceTier,
        project_scope: extractedLead.project_scope || null,
        estimated_value: extractedLead.estimated_value || null,
        lead_score: leadScore,
        pipeline_stage: 'new',
        status: isVA ? 'active' : 'archived',
        notes: `AI-discovered lead. ${!isVA ? 'Auto-archived: Outside Virginia.' : ''}`,
        discovered_at: new Date().toISOString(),
      };

      // Insert into Supabase (cast to bypass type checking)
      const { error: insertError } = await (supabase
        .from('leads') as any)
        .insert([leadData]);

      if (insertError) throw insertError;

      setStep('success');
      
      // Notify parent and close after delay
      if (onLeadAdded) onLeadAdded();
      
      setTimeout(() => {
        setOpen(false);
        resetDialog();
      }, 2000);

    } catch (err: any) {
      console.error('Error saving lead:', err);
      setError(err.message || 'Failed to save lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetDialog();
    }}>
      <DialogTrigger asChild>
        <Button className="w-full bg-majestic-teal hover:bg-majestic-teal/80 text-white gap-2">
          <Sparkles className="w-4 h-4" />
          Discover Leads
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-majestic-gold" />
            AI Lead Discovery
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Paste an email, inquiry, or any text - AI will extract the lead information.
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Input */}
        {step === 'input' && (
          <div className="space-y-4 mt-4">
            <Textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`Paste the email or inquiry here...

Example:
"Hi, my name is John Smith and I'm interested in getting a quote for a kitchen remodel. I live in Fairfax, VA 22030. You can reach me at john@email.com or (703) 555-0123. Looking to spend around $50,000."`}
              className="min-h-[200px] bg-background/50"
            />

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            <Button
              onClick={handleExtract}
              disabled={loading || !rawText.trim()}
              className="w-full bg-majestic-teal hover:bg-majestic-teal/80"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Extract Lead Data
                </>
              )}
            </Button>
          </div>
        )}

        {/* Step 2: Review */}
        {step === 'review' && extractedLead && (
          <div className="space-y-4 mt-4">
            <Card className="p-4 bg-background/50 border-border space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Extracted Information</h3>
                {isVA ? (
                  <div className="flex items-center gap-1 text-green-500 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Virginia Lead
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-amber-500 text-sm">
                    <XCircle className="w-4 h-4" />
                    Outside VA
                  </div>
                )}
              </div>

              <div className="grid gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Name:</span>
                  <span className="text-white">{extractedLead.name}</span>
                </div>
                
                {extractedLead.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Email:</span>
                    <span className="text-white">{extractedLead.email}</span>
                  </div>
                )}
                
                {extractedLead.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="text-white">{extractedLead.phone}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Location:</span>
                  <span className="text-white">
                    {extractedLead.location}, {extractedLead.zip_code}
                    {county && ` (${county})`}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Service:</span>
                  <span className="text-white">{extractedLead.service_type}</span>
                </div>
                
                {extractedLead.estimated_value && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Est. Value:</span>
                    <span className="text-majestic-gold font-semibold">
                      ${extractedLead.estimated_value.toLocaleString()}
                    </span>
                  </div>
                )}
                
                {extractedLead.project_scope && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <span className="text-muted-foreground text-xs">Project Details:</span>
                    <p className="text-white text-sm mt-1">{extractedLead.project_scope}</p>
                  </div>
                )}
              </div>
            </Card>

            {!isVA && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <p className="text-sm text-amber-500">
                  ⚠️ This lead is outside Virginia and will be auto-archived.
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep('input')}
                className="flex-1"
              >
                Back to Edit
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-majestic-teal hover:bg-majestic-teal/80"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Save Lead
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <p className="text-lg font-medium text-white">Lead Discovered & Saved!</p>
            <p className="text-sm text-muted-foreground mt-1">
              The AI-extracted lead has been added to your pipeline.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default DiscoverLeadDialog;
