// Utility functions for Supabase client management
// NOTE: This file is deprecated as we're moving away from Supabase Auth
// Use Auth Service microservice instead for authentication
import { supabaseClient } from "./supabase-client";

/**
 * Client-side only Supabase client
 * Use this only for database operations, NOT for authentication
 * Authentication is now handled by Auth Service microservice
 */
export const clientSupabase = supabaseClient;

/**
 * Type guard to check if we're on the server
 */
export const isServer = typeof window === "undefined";

// Re-export for convenience (database operations only)
export { supabaseClient };
