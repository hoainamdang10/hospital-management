import { getSchemaForService } from "@hospital/shared/dist/config/schema-mapping";
import { getConnectionPool } from "@hospital/shared/dist/database/schema-aware-connection-pool";
import logger from "@hospital/shared/dist/utils/logger";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Service configuration
const SERVICE_NAME = "medical-records-service";
const SCHEMA_NAME = getSchemaForService(SERVICE_NAME);

// Environment variables validation
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL environment variable is required");
}
if (!supabaseServiceKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required");
}

logger.info("Database configuration loaded for Medical Records Service", {
  service: "medical-records-service",
  url: supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  connectionPooling: true,
});

// Connection Pool Integration - Use schema-aware pool via helper wrappers

// Legacy direct client for backward compatibility (deprecated - use connectionPool instead)
export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: SCHEMA_NAME, // ✅ FIXED: Now uses medical_records_schema,
    },
    global: {
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        "X-Client-Info": `medical-records-service-${Date.now()}`,
      },
    },
  }
);

// Legacy function for backward compatibility (deprecated)
export function getSupabase(): SupabaseClient {
  return supabaseAdmin;
}

// New recommended database access methods using schema-aware connection pooling
const pool = getConnectionPool();
export const dbPool = {
  async executeQuery<T>(queryFn: (client: any) => Promise<T>): Promise<T> {
    const client = await pool.getConnection(SERVICE_NAME);
    return queryFn(client);
  },
  async executeFHIRValidation<T>(
    validationFn: (client: any) => Promise<T>
  ): Promise<T> {
    return pool.executeFHIRValidation(SERVICE_NAME, validationFn);
  },
  async executeDiagnosisOperation<T>(
    diagnosisFn: (client: any) => Promise<T>
  ): Promise<T> {
    const client = await pool.getConnection(SERVICE_NAME);
    return diagnosisFn(client);
  },
  async executeBulkOperation<T>(
    bulkFn: (client: any) => Promise<T>
  ): Promise<T> {
    const client = await pool.getConnection(SERVICE_NAME);
    return bulkFn(client);
  },
};

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from("medical_records")
      .select("count(*)", { count: "exact", head: true });

    if (error) {
      logger.error("Database connection test failed", { error });
      return false;
    }

    logger.info("Database connection test successful", {
      service: "medical-records-service",
    });
    return true;
  } catch (error) {
    logger.error("Database connection test exception", { error });
    return false;
  }
}

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
