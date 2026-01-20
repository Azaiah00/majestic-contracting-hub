/**
 * ===========================================
 * HEADER COMPONENT
 * ===========================================
 * Top navigation bar with page title,
 * quick actions, and notifications.
 */

'use client';

import { Bell, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { NewLeadDialog } from '@/components/leads/NewLeadDialog';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showNewLeadButton?: boolean;
  onNewLead?: () => void;
  onRefresh?: () => void;
}

/**
 * Dashboard Header Component.
 * Displays page title and quick action buttons.
 */
export function Header({
  title,
  subtitle,
  showNewLeadButton = true,
  onNewLead,
  onRefresh,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left side - Title */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        
        {/* Right side - Actions */}
        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onRefresh}
                  className="hover:bg-white/5"
                >
                  <RefreshCw className="w-4 h-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh data</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Notifications */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative hover:bg-white/5"
                >
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  {/* Notification badge */}
                  <span className="absolute top-1 right-1 w-2 h-2 bg-majestic-gold rounded-full" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Notifications</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* New Lead Button */}
          {showNewLeadButton && (
            <NewLeadDialog onLeadAdded={onRefresh} />
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
