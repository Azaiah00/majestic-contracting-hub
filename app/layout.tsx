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
    icon: [
      { url: '/favicon-2.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-2.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon-2.png',
    apple: '/favicon-2.png',
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
      <head>
        <link rel="icon" href="/favicon-2.png" type="image/png" sizes="32x32" />
        <link rel="shortcut icon" href="/favicon-2.png" />
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}
      >
        <DashboardLayout>{children}</DashboardLayout>
      </body>
    </html>
  );
}
