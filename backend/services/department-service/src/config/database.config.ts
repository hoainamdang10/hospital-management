import { getSchemaForService } from "@hospital/shared/dist/config/schema-mapping";
import { getConnectionPool } from "@hospital/shared/dist/database/schema-aware-connection-pool";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Service configuration
const SERVICE_NAME = "department-service";
const SCHEMA_NAME = getSchemaForService(SERVICE_NAME);

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing Supabase configuration. Please check your environment variables."
  );
}

// Client for authenticated operations
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

// Admin client for service operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: SCHEMA_NAME, // ✅ FIXED: Now uses auth_schema
  },
});

// Database configuration
export const dbConfig = {
  url: supabaseUrl,
  maxConnections: 20,
  connectionTimeout: 30000,
  queryTimeout: 60000,
  retryAttempts: 3,
  retryDelay: 1000,
};

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabaseAdmin
      .from("departments")
      .select("department_id")
      .limit(1);

    if (error) {
      console.error("Database connection test failed:", error);
      return false;
    }

    console.log("✅ Database connection successful");
    return true;
  } catch (error) {
    console.error("Database connection test error:", error);
    return false;
  }
};

/**
 * Get a schema-aware connection from the pool
 */
export async function getSchemaAwareConnection(): Promise<SupabaseClient> {
  const connectionPool = getConnectionPool();
  return connectionPool.getConnection(SERVICE_NAME);
}

/**
 * Execute query with FHIR validation for healthcare compliance
 */
export async function executeFHIRQuery<T>(
  queryFn: (client: SupabaseClient) => Promise<T>
): Promise<T> {
  const connectionPool = getConnectionPool();
  return connectionPool.executeFHIRValidation(SERVICE_NAME, queryFn);
}
