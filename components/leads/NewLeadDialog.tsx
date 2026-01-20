/**
 * ===========================================
 * NEW LEAD DIALOG COMPONENT
 * ===========================================
 * Modal dialog for adding new leads to the database.
 * Validates VA location and calculates lead score automatically.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Loader2, CheckCircle, XCircle, MapPin } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { SERVICE_TO_TIER, getServiceTier } from '@/lib/leads/categorization';
import { isVirginiaZipCode, getCountyFromZip } from '@/lib/leads/validation';
import { calculateLeadScore } from '@/lib/leads/scoring';
import type { ServiceType } from '@/types/lead';

interface NewLeadDialogProps {
  onLeadAdded?: () => void;
}

export function NewLeadDialog({ onLeadAdded }: NewLeadDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    zip_code: '',
    service_type: '',
    project_scope: '',
    estimated_value: '',
  });

  // Check if zip code is valid VA
  const isVA = formData.zip_code.length >= 5 && isVirginiaZipCode(formData.zip_code);
  const county = formData.zip_code.length >= 5 ? getCountyFromZip(formData.zip_code) : null;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Find service tier
      const serviceTier = getServiceTier(formData.service_type as ServiceType);

      // Calculate lead score
      const leadScore = calculateLeadScore({
        serviceTier: serviceTier,
        estimatedValue: formData.estimated_value ? parseFloat(formData.estimated_value) : undefined,
        hasEmail: !!formData.email,
        hasPhone: !!formData.phone,
        county: county || undefined,
      });

      // Prepare lead data
      const leadData = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        location: formData.location,
        zip_code: formData.zip_code,
        county: county,
        state: isVA ? 'VA' : null,
        service_type: formData.service_type,
        service_tier: serviceTier,
        project_scope: formData.project_scope || null,
        estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : null,
        lead_score: leadScore,
        pipeline_stage: 'new',
        status: isVA ? 'active' : 'archived',
        notes: !isVA ? 'Auto-archived: Location outside Virginia' : null,
        discovered_at: new Date().toISOString(),
      };

      // Insert into Supabase
      if (!supabase) {
        throw new Error('Database not configured. Please check your .env.local file.');
      }
      
      const { data, error: insertError } = await (supabase
        .from('leads') as any)
        .insert([leadData])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Success!
      setSuccess(true);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        location: '',
        zip_code: '',
        service_type: '',
        project_scope: '',
        estimated_value: '',
      });

      // Notify parent
      if (onLeadAdded) {
        onLeadAdded();
      }

      // Close dialog after short delay
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
      }, 1500);

    } catch (err: any) {
      console.error('Error adding lead:', err);
      setError(err.message || 'Failed to add lead');
    } finally {
      setLoading(false);
    }
  };

  // Group services by tier for select
  const tierNames: Record<number, string> = {
    1: 'Epic',
    2: 'Modernize',
    3: 'Exterior',
    4: 'Service',
  };
  
  const servicesByTier = Object.entries(SERVICE_TO_TIER).reduce((acc, [serviceName, tier]) => {
    const tierLabel = `Tier ${tier} - ${tierNames[tier]}`;
    if (!acc[tierLabel]) acc[tierLabel] = [];
    acc[tierLabel].push({ name: serviceName, tier });
    return acc;
  }, {} as Record<string, { name: string; tier: number }[]>);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-majestic-teal hover:bg-majestic-teal/80 text-white">
          <Plus className="w-4 h-4 mr-2" />
          New Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            Add New Lead
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <p className="text-lg font-medium text-white">Lead Added Successfully!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Name */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Client Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Smith"
                required
                className="mt-1"
              />
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Email
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@email.com"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Phone
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(703) 555-0123"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Location & Zip */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  City/Location *
                </label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Fairfax"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Zip Code *
                </label>
                <div className="relative">
                  <Input
                    value={formData.zip_code}
                    onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                    placeholder="22030"
                    required
                    maxLength={5}
                    className="mt-1 pr-10"
                  />
                  {formData.zip_code.length >= 5 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5">
                      {isVA ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {county && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {county}
                  </p>
                )}
                {formData.zip_code.length >= 5 && !isVA && (
                  <p className="text-xs text-amber-500 mt-1">
                    ⚠️ Outside VA - will be auto-archived
                  </p>
                )}
              </div>
            </div>

            {/* Service Type */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Service Type *
              </label>
              <Select
                value={formData.service_type}
                onValueChange={(value) => setFormData({ ...formData, service_type: value })}
                required
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a service..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(servicesByTier).map(([tier, services]) => (
                    <div key={tier}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        {tier}
                      </div>
                      {services.map((service) => (
                        <SelectItem key={service.name} value={service.name}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Project Scope */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Project Scope
              </label>
              <Input
                value={formData.project_scope}
                onChange={(e) => setFormData({ ...formData, project_scope: e.target.value })}
                placeholder="Brief description of the project..."
                className="mt-1"
              />
            </div>

            {/* Estimated Value */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Estimated Value ($)
              </label>
              <Input
                type="number"
                value={formData.estimated_value}
                onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                placeholder="50000"
                min="0"
                className="mt-1"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || !formData.name || !formData.zip_code || !formData.service_type}
              className="w-full bg-majestic-teal hover:bg-majestic-teal/80"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding Lead...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Lead
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default NewLeadDialog;
