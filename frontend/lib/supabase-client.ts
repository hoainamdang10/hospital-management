/**
 * Supabase Client for Frontend
 * Used for Realtime subscriptions to notifications
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const missingEnv = !supabaseUrl || !supabaseAnonKey;
if (missingEnv) {
  console.warn('[Supabase] Missing environment variables. Realtime features will be disabled.');
}

let supabase: SupabaseClient | null = null;
if (!missingEnv) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // We use session-based auth via API Gateway
      autoRefreshToken: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
}

export { supabase };

export const isSupabaseConfigured = () => Boolean(!missingEnv && supabase);
