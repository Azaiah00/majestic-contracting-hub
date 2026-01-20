/**
 * ===========================================
 * SUPABASE SERVER CLIENT
 * ===========================================
 * Creates a Supabase client for server-side operations.
 * Uses the service role key for elevated permissions.
 * 
 * IMPORTANT: Never expose the service role key to the client!
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Environment variables for Supabase connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Server-side Supabase client with elevated permissions.
 * Use this in API routes and server components.
 * 
 * This client bypasses RLS policies - use with caution!
 */
export function createServerSupabaseClient() {
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      // Disable auto-refresh and persistence for server-side usage
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Singleton instance for server-side operations.
 * Reuses the same client across requests for efficiency.
 */
let serverClient: ReturnType<typeof createClient<Database>> | null = null;

export function getServerSupabaseClient() {
  if (!serverClient) {
    serverClient = createServerSupabaseClient();
  }
  return serverClient;
}
