/**
 * ===========================================
 * SIDEBAR COMPONENT
 * ===========================================
 * Dark luxury sidebar with Majestic M logo,
 * navigation links, and glassmorphism styling.
 * 
 * Follows the "Tiny Houses" dark mode aesthetic.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  Search,
  Bell,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { DiscoverLeadDialog } from '@/components/leads/DiscoverLeadDialog';

/**
 * Navigation item configuration.
 */
interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

/**
 * Main navigation items for the Command Center.
 */
const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    label: 'Lead Finder',
    href: '/leads/finder',
    icon: Sparkles,
  },
  {
    label: 'Lead Feed',
    href: '/leads',
    icon: Users,
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    label: 'VA Territory',
    href: '/territory',
    icon: MapPin,
  },
];

/**
 * Majestic Logo Component.
 * Uses the official Majestic Contracting logo.
 */
function MajesticLogo() {
  return (
    <div className="flex items-center justify-center">
      {/* Official Majestic logo - using img tag for simplicity */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-white.png"
        alt="Majestic Contracting"
        className="w-full max-w-[200px] h-auto object-contain"
      />
    </div>
  );
}

/**
 * Individual navigation link component.
 */
function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon;
  
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
        'hover:bg-white/5 hover:translate-x-1',
        isActive && 'bg-majestic-teal/20 text-majestic-teal border-l-2 border-majestic-teal'
      )}
    >
      <Icon className={cn(
        'w-5 h-5',
        isActive ? 'text-majestic-teal' : 'text-muted-foreground'
      )} />
      <span className={cn(
        'font-medium',
        isActive ? 'text-white' : 'text-muted-foreground'
      )}>
        {item.label}
      </span>
      
      {/* Optional badge for notifications */}
      {item.badge && item.badge > 0 && (
        <span className="ml-auto bg-majestic-gold text-black text-xs font-bold px-2 py-0.5 rounded-full">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

/**
 * Main Sidebar Component.
 * Fixed position, dark background with subtle border.
 */
export function Sidebar() {
  const pathname = usePathname();
  
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-50">
      {/* Logo Section */}
      <div className="p-6 border-b border-sidebar-border">
        <MajesticLogo />
      </div>
      
      {/* Search Bar */}
      <div className="px-4 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search leads..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-majestic-teal/50 focus:border-majestic-teal transition-all"
          />
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={pathname === item.href}
          />
        ))}
      </nav>
      
      {/* Quick Actions - AI Lead Discovery */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        <DiscoverLeadDialog />
      </div>
      
      {/* Bottom Section - Settings & Notifications */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between">
          <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <Bell className="w-5 h-5 text-muted-foreground" />
          </button>
          <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
          
          {/* User avatar placeholder */}
          <div className="w-8 h-8 rounded-full bg-majestic-teal/30 border-2 border-majestic-teal flex items-center justify-center">
            <span className="text-xs font-bold text-majestic-teal">MC</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
