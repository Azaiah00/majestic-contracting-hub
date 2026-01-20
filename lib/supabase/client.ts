/**
 * ===========================================
 * SUPABASE CLIENT - Browser/Client Side
 * ===========================================
 * Creates a Supabase client for use in React components.
 * Uses the anon key which is safe to expose in the browser.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Environment variables for Supabase connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Singleton instance
let supabaseInstance: SupabaseClient<Database> | null = null;

/**
 * Gets the Supabase client instance.
 * Creates it lazily on first access.
 * Returns null if environment variables are not configured.
 */
export function getSupabaseClient(): SupabaseClient<Database> | null {
  // Check if we have the required environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      'Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
    );
    return null;
  }

  // Create instance if it doesn't exist
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey);
  }

  return supabaseInstance;
}

/**
 * Browser-side Supabase client instance.
 * Use this in React components and client-side code.
 * 
 * Note: May be null if environment variables aren't configured.
 */
export const supabase = getSupabaseClient();

/**
 * Creates a new Supabase client instance.
 * Useful when you need a fresh client or custom options.
 */
export function createSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}

/**
 * Checks if Supabase is configured properly.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}
