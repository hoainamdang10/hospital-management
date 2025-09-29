'use client';

import { createClient } from '@supabase/supabase-js';

// Shared configuration
export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
};

// Validate environment variables
if (!supabaseConfig.url) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!supabaseConfig.anonKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Common auth configuration
export const authConfig = {
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: true,
  flowType: 'pkce' as const,
};

// Client-side Supabase client
export const supabaseClient = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
  auth: authConfig
});
