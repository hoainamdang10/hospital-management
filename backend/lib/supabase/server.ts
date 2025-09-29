/**
 * Supabase Server Client Configuration
 * For server-side operations with service role
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { Database } from "./types";

// Environment variables validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

if (!supabaseServiceKey) {
  throw new Error("Missing Supabase service role key");
}

// Server-side client with user context (for Route Handlers)
export function createServerClient() {
  const cookieStore = cookies();

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch (error) {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch (error) {
          // The `delete` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

// Service role client (for admin operations)
export const supabaseAdmin: SupabaseClient<Database> = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      // Chỉ sử dụng schema dành cho Auth; không dùng 'public' để tránh vi phạm schema-per-service
      schema: "auth_schema",
    },
    global: {
      headers: {
        "X-Client-Info": "hospital-management-admin",
      },
    },
  }
);

// Helper function to get user from server
export async function getServerUser() {
  const supabase = createServerClient();

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error("Error getting server user:", error);
    return null;
  }
}

// Helper function to get user session from server
export async function getServerSession() {
  const supabase = createServerClient();

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
    console.error("Error getting server session:", error);
    return null;
  }
}

// Helper function to get user profile with role
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
}

// Helper function to check user role
export async function checkUserRole(userId: string, allowedRoles: string[]) {
  const profile = await getUserProfile(userId);
  if (!profile) return false;

  return allowedRoles.includes(profile.role);
}

export default supabaseAdmin;
