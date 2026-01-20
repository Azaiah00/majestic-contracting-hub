/**
 * ===========================================
 * LEAD PROFILE PAGE
 * ===========================================
 * Detailed view for individual lead showing
 * their "Majestic Journey" and all information.
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  User,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Edit,
} from 'lucide-react';
import { getMockLeadById, type MockLead } from '@/lib/leads/mock-data';
import { ServiceBadge } from '@/components/leads/ServiceBadge';
import { getTierLabel, getTierColor } from '@/lib/leads/categorization';
import { getScoreLabel, getScoreColor } from '@/lib/leads/scoring';
import { STAGE_CONFIG } from '@/components/pipeline/PipelineColumn';

interface LeadProfilePageProps {
  params: Promise<{ id: string }>;
}

/**
 * Timeline item for lead journey.
 */
function TimelineItem({
  title,
  description,
  date,
  icon: Icon,
  isLast = false,
}: {
  title: string;
  description?: string;
  date: string;
  icon: React.ElementType;
  isLast?: boolean;
}) {
  return (
    <div className="flex gap-4">
      {/* Icon and line */}
      <div className="flex flex-col items-center">
        <div className="p-2 rounded-full bg-majestic-teal/20 text-majestic-teal">
          <Icon className="w-4 h-4" />
        </div>
        {!isLast && <div className="flex-1 w-px bg-white/10 my-2" />}
      </div>
      
      {/* Content */}
      <div className="pb-6">
        <p className="font-medium text-white">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
        <p className="text-xs text-muted-foreground/70 mt-1">{date}</p>
      </div>
    </div>
  );
}

/**
 * Info row component.
 */
function InfoRow({
  icon: Icon,
  label,
  value,
  className = '',
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between py-3 ${className}`}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="w-4 h-4" />
        <span className="text-sm">{label}</span>
      </div>
      <div className="text-sm text-white">{value}</div>
    </div>
  );
}

/**
 * Lead Profile Page Component.
 */
export default async function LeadProfilePage({ params }: LeadProfilePageProps) {
  const { id } = await params;
  
  // Get lead data (in production, this would fetch from Supabase)
  const lead = getMockLeadById(id);
  
  if (!lead) {
    notFound();
  }
  
  // Format dates
  const createdDate = lead.createdAt.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  
  const lastContactDate = lead.lastContactedAt
    ? new Date(lead.lastContactedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Never';
  
  const stageConfig = STAGE_CONFIG[lead.pipelineStage];
  const scoreColorClass = getScoreColor(lead.leadScore);
  
  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center gap-4">
        <Link href="/leads">
          <Button variant="ghost" size="icon" className="hover:bg-white/5">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <Header
          title={lead.name}
          subtitle="Lead Profile"
          showNewLeadButton={false}
        />
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          <Card className="glass p-6 border-white/10">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {lead.name}
                </h2>
                <ServiceBadge
                  serviceType={lead.serviceType}
                  tier={lead.serviceTier}
                  showTierLabel
                />
              </div>
              
              {/* Score */}
              <div className="text-right">
                <div className={`text-4xl font-bold ${scoreColorClass}`}>
                  {lead.leadScore}
                </div>
                <div className="text-sm text-muted-foreground">
                  {getScoreLabel(lead.leadScore)}
                </div>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-white/5">
                <p className="text-2xl font-bold text-majestic-gold">
                  ${((lead.estimatedValue || 0) / 1000).toFixed(0)}k
                </p>
                <p className="text-xs text-muted-foreground">Est. Value</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-white/5">
                <Badge className={`${stageConfig.bgColor} ${stageConfig.color}`}>
                  {stageConfig.label}
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">Pipeline Stage</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-white/5">
                <div className="flex items-center justify-center gap-1">
                  {lead.isVirginiaValidated ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {lead.isVirginiaValidated ? 'VA Verified' : 'Out of Area'}
                </p>
              </div>
            </div>
          </Card>
          
          {/* Contact Information */}
          <Card className="glass p-6 border-white/10">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-majestic-teal" />
              Contact Information
            </h3>
            
            <div className="divide-y divide-white/5">
              <InfoRow
                icon={Phone}
                label="Phone"
                value={lead.phone || 'Not provided'}
              />
              <InfoRow
                icon={Mail}
                label="Email"
                value={lead.email || 'Not provided'}
              />
              <InfoRow
                icon={MapPin}
                label="Location"
                value={`${lead.location}, ${lead.county || ''} ${lead.state} ${lead.zipCode}`}
              />
            </div>
            
            {/* Contact Actions */}
            <div className="flex gap-3 mt-6">
              {lead.phone && (
                <Button className="flex-1 bg-majestic-teal hover:bg-majestic-teal/80">
                  <Phone className="w-4 h-4 mr-2" />
                  Call Now
                </Button>
              )}
              {lead.email && (
                <Button variant="outline" className="flex-1">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
              )}
            </div>
          </Card>
          
          {/* Project Details */}
          <Card className="glass p-6 border-white/10">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-majestic-teal" />
              Project Details
            </h3>
            
            <div className="divide-y divide-white/5">
              <InfoRow
                icon={DollarSign}
                label="Estimated Value"
                value={lead.estimatedValue ? `$${lead.estimatedValue.toLocaleString()}` : 'TBD'}
              />
              <InfoRow
                icon={FileText}
                label="Project Scope"
                value={
                  <span className="capitalize">
                    {lead.projectScope || 'Not specified'}
                  </span>
                }
              />
              <InfoRow
                icon={Calendar}
                label="Created"
                value={createdDate}
              />
              <InfoRow
                icon={Clock}
                label="Last Contact"
                value={
                  <span className={lead.isStale ? 'text-amber-500' : ''}>
                    {lastContactDate}
                    {lead.isStale && ' (Stale)'}
                  </span>
                }
              />
            </div>
            
            {/* Notes */}
            {lead.notes && (
              <>
                <Separator className="my-4 bg-white/10" />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Notes</p>
                  <p className="text-sm text-white bg-white/5 p-3 rounded-lg">
                    {lead.notes}
                  </p>
                </div>
              </>
            )}
          </Card>
        </div>
        
        {/* Right Column - Timeline & Actions */}
        <div className="space-y-6">
          {/* Actions Card */}
          <Card className="glass p-6 border-white/10">
            <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
            
            <div className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <MessageSquare className="w-4 h-4 mr-2" />
                Add Note
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit Lead
              </Button>
              <Button className="w-full justify-start bg-majestic-teal hover:bg-majestic-teal/80">
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark as Contacted
              </Button>
            </div>
          </Card>
          
          {/* Journey Timeline */}
          <Card className="glass p-6 border-white/10">
            <h3 className="font-semibold text-white mb-4">Majestic Journey</h3>
            
            <div className="mt-4">
              <TimelineItem
                title="Lead Created"
                description="Lead entered the system"
                date={createdDate}
                icon={User}
              />
              
              {lead.pipelineStage !== 'new' && (
                <TimelineItem
                  title="First Contact"
                  description="Initial outreach made"
                  date={lastContactDate !== 'Never' ? lastContactDate : 'Pending'}
                  icon={Phone}
                />
              )}
              
              {(lead.pipelineStage === 'design_phase' || 
                lead.pipelineStage === 'quoted' || 
                lead.pipelineStage === 'closed') && (
                <TimelineItem
                  title="Design Phase"
                  description="Project planning in progress"
                  date="In Progress"
                  icon={FileText}
                />
              )}
              
              {(lead.pipelineStage === 'quoted' || lead.pipelineStage === 'closed') && (
                <TimelineItem
                  title="Quote Sent"
                  description={`$${((lead.estimatedValue || 0) / 1000).toFixed(0)}k estimate`}
                  date="Pending"
                  icon={DollarSign}
                />
              )}
              
              <TimelineItem
                title="Close Deal"
                description={lead.pipelineStage === 'closed' ? 'Deal Won!' : 'Awaiting decision'}
                date={lead.pipelineStage === 'closed' ? 'Completed' : 'Pending'}
                icon={CheckCircle}
                isLast
              />
            </div>
          </Card>
          
          {/* Tier Info */}
          <Card className="glass p-6 border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: getTierColor(lead.serviceTier) }}
              />
              <h3 className="font-semibold text-white">
                {getTierLabel(lead.serviceTier)} Lead
              </h3>
            </div>
            
            <p className="text-sm text-muted-foreground">
              {lead.serviceTier === 1 && 'High-value project requiring dedicated attention and long-term nurturing.'}
              {lead.serviceTier === 2 && 'Core revenue opportunity. Focus on design excellence and competitive pricing.'}
              {lead.serviceTier === 3 && 'Specialty project with potential for upsell to larger services.'}
              {lead.serviceTier === 4 && 'Quick-turnaround service. Prioritize fast response and scheduling.'}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
