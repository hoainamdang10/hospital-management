import { getConnectionPool } from "@hospital/shared/dist/database/schema-aware-connection-pool";
import dotenv from "dotenv";
dotenv.config();

import { getSchemaForService } from "@hospital/shared/dist/config/schema-mapping";
import logger from "@hospital/shared/dist/utils/logger";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Service configuration
const SERVICE_NAME = "auth-service";
const SCHEMA_NAME = getSchemaForService(SERVICE_NAME);

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Validate required environment variables
if (!supabaseUrl) {
  throw new Error("SUPABASE_URL environment variable is required");
}

if (!supabaseServiceKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required");
}

if (!supabaseAnonKey) {
  throw new Error("SUPABASE_ANON_KEY environment variable is required");
}

logger.info("Database configuration loaded for Auth Service", {
  service: "auth-service",
  url: supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  hasAnonKey: !!supabaseAnonKey,
  connectionPooling: true,
});

// Connection Pool Integration - Use schema-aware pool via helper wrappers

// Legacy direct client for backward compatibility (deprecated - use connectionPool instead)
export const supabaseAdmin: SupabaseClient<any, "public", any> = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: SCHEMA_NAME, // ✅ FIXED: Now uses auth_schema
    },
    global: {
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        "X-Client-Info": `auth-service-${Date.now()}`, // Force new client
      },
    },
  }
);

// Fresh client for schema-sensitive operations
export const supabaseFresh: SupabaseClient<any, "public", any> = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: SCHEMA_NAME, // ✅ FIXED: Now uses auth_schema
    },
    global: {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "X-Client-Info": `fresh-client-${Date.now()}`,
      },
    },
  }
);

// Anonymous client (for public operations)
export const supabaseClient: SupabaseClient<any, "public", any> = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
    db: {
      schema: SCHEMA_NAME, // ✅ FIXED: Now uses auth_schema
    },
  }
);

// Test connection and validate setup
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    logger.info("🔍 Testing Supabase connection...");

    // Test schema-aware connection
    const schemaClient = await getSchemaAwareConnection();
    const { data: adminTest, error: adminError } = await schemaClient
      .from("profiles")
      .select("count")
      .limit(1);

    if (adminError) {
      logger.error("❌ Supabase schema-aware client connection failed:", {
        error: adminError.message,
        code: adminError.code,
        details: adminError.details,
        schema: SCHEMA_NAME,
      });
      return false;
    }

    logger.info("✅ Supabase schema-aware connection test successful", {
      schema: SCHEMA_NAME,
      profilesAccessible: true,
    });

    return true;
  } catch (error: any) {
    logger.error("❌ Supabase connection test error:", {
      error: error.message,
      stack: error.stack,
    });
    return false;
  }
};

// Initialize and test connection on startup
export const initializeSupabase = async (): Promise<void> => {
  logger.info("🚀 Initializing Supabase connection...");

  const isConnected = await testSupabaseConnection();

  if (!isConnected) {
    logger.error(
      "❌ Failed to connect to Supabase. Please check your configuration."
    );
    // Do not crash the service in development; start in degraded mode and report unhealthy in /health
    logger.warn(
      "⚠️ Starting Auth Service in degraded mode (Supabase unavailable)"
    );
    return; // allow service to start; health endpoint will reflect the issue
  }

  logger.info("✅ Supabase initialized successfully");
};

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

export default {
  admin: supabaseAdmin,
  client: supabaseClient,
  testConnection: testSupabaseConnection,
  dbPool,
};

/**
 * Get a schema-aware connection from the pool
 */
export async function getSchemaAwareConnection(): Promise<any> {
  const connectionPool = getConnectionPool();
  return connectionPool.getConnection(SERVICE_NAME);
}

/**
 * Execute query with FHIR validation for healthcare compliance
 */
export async function executeFHIRQuery<T>(
  queryFn: (client: any) => Promise<T>
): Promise<T> {
  const connectionPool = getConnectionPool();
  return connectionPool.executeFHIRValidation(SERVICE_NAME, queryFn);
}
