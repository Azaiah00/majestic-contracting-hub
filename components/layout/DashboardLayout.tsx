/**
 * ===========================================
 * DASHBOARD LAYOUT COMPONENT
 * ===========================================
 * Main layout wrapper for the Command Center.
 * Includes sidebar and content area.
 */

import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Dashboard Layout Component.
 * Provides the main layout structure with sidebar.
 * 
 * The sidebar is fixed at 256px (w-64).
 * Content area fills remaining space with left padding.
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <main className="pl-64 min-h-screen">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;
