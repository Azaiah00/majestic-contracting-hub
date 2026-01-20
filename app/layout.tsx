/**
 * ===========================================
 * ROOT LAYOUT
 * ===========================================
 * Main application layout with dark theme,
 * fonts, and global providers.
 */

import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import './globals.css';

/**
 * Application metadata for SEO and browser.
 */
export const metadata: Metadata = {
  title: 'Majestic Command Center | Lead Intelligence Hub',
  description: 'High-performance lead generation and nurturing hub for Majestic Contracting - Design | Build | Renovate',
  keywords: ['construction', 'contracting', 'leads', 'CRM', 'Virginia'],
  icons: {
    icon: '/favicon-1.png',
    shortcut: '/favicon-1.png',
    apple: '/favicon-1.png',
  },
};

/**
 * Root Layout Component.
 * Wraps all pages with theme, fonts, and layout.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}
      >
        <DashboardLayout>{children}</DashboardLayout>
      </body>
    </html>
  );
}
