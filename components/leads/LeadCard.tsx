/**
 * ===========================================
 * LEAD CARD COMPONENT
 * ===========================================
 * Individual lead display card with service badge,
 * score indicator, location, and quick actions.
 * 
 * Follows the dark luxury aesthetic from Tiny Houses.
 */

'use client';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  MoreVertical,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Globe,
  Building2,
  Trophy,
  Zap,
  Crown,
  Home,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ServiceBadge, TierDot } from './ServiceBadge';
import { getScoreColor, getScoreLabel } from '@/lib/leads/scoring';
import { getTagColor, type LeadTag } from '@/lib/leads/tagging';
import type { Lead, ServiceTier, PipelineStage, LeadType } from '@/types/lead';

interface LeadCardProps {
  lead: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    location: string;
    zipCode: string;
    county: string | null;
    serviceType: string;
    serviceTier: ServiceTier;
    leadScore: number;
    pipelineStage: PipelineStage;
    estimatedValue: number | null;
    lastContactedAt: Date | null;
    createdAt: Date;
    isStale?: boolean;
    isVirginiaValidated?: boolean;
    // New Lead Finder fields
    leadType?: LeadType | null;
    company?: string | null;
    website?: string | null;
    tags?: LeadTag[];
    confidenceScore?: number | null;
    serviceNeed?: string | null;
  };
  onContact?: (id: string) => void;
  onViewProfile?: (id: string) => void;
  onMoveStage?: (id: string, stage: PipelineStage) => void;
  compact?: boolean;
  className?: string;
}

/**
 * Formats currency values for display.
 */
function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}k`;
  }
  return `$${value.toFixed(0)}`;
}

/**
 * Calculates time since a date in human-readable format.
 */
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

/**
 * Tag icon component for displaying tag badges.
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
 * Lead type badge color getter.
 */
function getLeadTypeBadgeColor(type: LeadType | null | undefined): string {
  switch (type) {
    case 'Investor':
      return 'bg-green-500/20 text-green-400';
    case 'Property Manager':
      return 'bg-blue-500/20 text-blue-400';
    case 'HOA Manager':
      return 'bg-purple-500/20 text-purple-400';
    case 'Commercial':
      return 'bg-orange-500/20 text-orange-400';
    default:
      return 'bg-gray-500/20 text-gray-400';
  }
}

/**
 * Lead Score Display Component.
 * Shows the score with color coding.
 */
function LeadScoreDisplay({ score }: { score: number }) {
  const colorClass = getScoreColor(score);
  const label = getScoreLabel(score);
  
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-12 h-12">
        {/* Background circle */}
        <svg className="w-12 h-12 -rotate-90">
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-white/10"
          />
          {/* Progress arc */}
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeDasharray={`${score * 1.26} 126`}
            strokeLinecap="round"
            className={colorClass}
          />
        </svg>
        {/* Score number */}
        <span className={cn(
          'absolute inset-0 flex items-center justify-center text-sm font-bold',
          colorClass
        )}>
          {score}
        </span>
      </div>
      <span className="text-xs text-muted-foreground hidden sm:block">
        {label}
      </span>
    </div>
  );
}

/**
 * Main Lead Card Component.
 * Displays lead information with actions.
 */
export function LeadCard({
  lead,
  onContact,
  onViewProfile,
  onMoveStage,
  compact = false,
  className,
}: LeadCardProps) {
  const isStale = lead.isStale ?? false;
  const isVA = lead.isVirginiaValidated ?? true;
  
  return (
    <Card className={cn(
      'glass border-white/10 hover:border-white/20 transition-all duration-200',
      'hover:translate-y-[-2px] hover:shadow-lg hover:shadow-majestic-teal/5',
      isStale && 'border-l-2 border-l-amber-500',
      className
    )}>
      <div className={cn('p-4', compact && 'p-3')}>
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          {/* Left: Name and Service */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <TierDot tier={lead.serviceTier} />
              <h3 className="font-semibold text-white truncate">
                {lead.name}
              </h3>
              {isStale && (
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <ServiceBadge
                serviceType={lead.serviceType}
                tier={lead.serviceTier}
                size="sm"
              />
              {lead.leadType && (
                <Badge 
                  variant="secondary" 
                  className={cn('text-xs', getLeadTypeBadgeColor(lead.leadType))}
                >
                  {lead.leadType}
                </Badge>
              )}
            </div>
            {/* Company name */}
            {lead.company && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Building2 className="w-3 h-3" />
                {lead.company}
              </p>
            )}
          </div>
          
          {/* Right: Score */}
          <LeadScoreDisplay score={lead.leadScore} />
        </div>
        
        {/* Tags Row */}
        {lead.tags && lead.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
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
        )}
        
        {/* Details Row */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
          {/* Location */}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">
              {lead.county || lead.location}
              {!isVA && (
                <span className="text-red-400 ml-1">(Not VA)</span>
              )}
            </span>
          </div>
          
          {/* Estimated Value */}
          {lead.estimatedValue && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="text-majestic-gold font-medium">
                {formatCurrency(lead.estimatedValue)}
              </span>
            </div>
          )}
          
          {/* Last Contact */}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {lead.lastContactedAt
                ? getTimeAgo(new Date(lead.lastContactedAt))
                : 'Never contacted'}
            </span>
          </div>
          
          {/* Pipeline Stage */}
          <div>
            <Badge variant="secondary" className="text-xs capitalize">
              {lead.pipelineStage.replace('_', ' ')}
            </Badge>
          </div>
        </div>
        
        {/* Contact Info */}
        {!compact && (
          <div className="flex flex-wrap items-center gap-3 mb-3 text-sm">
            {lead.phone && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Phone className="w-3.5 h-3.5" />
                {lead.phone}
              </span>
            )}
            {lead.email && (
              <span className="flex items-center gap-1 text-muted-foreground truncate">
                <Mail className="w-3.5 h-3.5" />
                {lead.email}
              </span>
            )}
            {lead.website && (
              <a 
                href={lead.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-muted-foreground hover:text-majestic-teal transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                Website
              </a>
            )}
          </div>
        )}
        
        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewProfile?.(lead.id)}
            className="text-muted-foreground hover:text-white hover:bg-white/5"
          >
            View Profile
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onContact?.(lead.id)}
              className="text-majestic-teal hover:bg-majestic-teal/10"
            >
              <Phone className="w-4 h-4 mr-1" />
              Contact
            </Button>
            
            {/* More Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-white/5"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onMoveStage?.(lead.id, 'contacted')}>
                  Mark as Contacted
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMoveStage?.(lead.id, 'design_phase')}>
                  Move to Design Phase
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMoveStage?.(lead.id, 'quoted')}>
                  Move to Quoted
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onMoveStage?.(lead.id, 'closed')}>
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  Close as Won
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default LeadCard;
