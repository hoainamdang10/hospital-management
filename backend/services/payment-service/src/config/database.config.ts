import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getConnectionPool } from "@hospital/shared/dist/database/schema-aware-connection-pool";
import { getSchemaForService } from "@hospital/shared/dist/config/schema-mapping";
import logger from "@hospital/shared/dist/utils/logger";

// Service configuration
const SERVICE_NAME = 'payment-service';
const SCHEMA_NAME = getSchemaForService(SERVICE_NAME);

// Environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing required Supabase environment variables");
}

// Schema-aware Supabase client
export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: SCHEMA_NAME, // ✅ FIXED: Now uses payment_schema
    },
    global: {
      headers: {
        'X-Service-Name': SERVICE_NAME,
        'X-Schema-Name': SCHEMA_NAME,
        'X-Service-Version': '2.0.0'
      }
    }
  }
);

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

/**
 * Test database connection with schema validation
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const client = await getSchemaAwareConnection();
    // Test with a simple query appropriate for the service
    const { error } = await client.from('payments').select('count(*)').limit(1);
    
    if (error) {
      logger.error("Database connection test failed", { 
        error, 
        service: SERVICE_NAME,
        schema: SCHEMA_NAME 
      });
      return false;
    }

    logger.info("✅ Database connection test successful", {
      service: SERVICE_NAME,
      schema: SCHEMA_NAME,
      connectionType: "schema-aware-pool"
    });
    return true;
  } catch (error) {
    logger.error("❌ Database connection test failed", { 
      error, 
      service: SERVICE_NAME,
      schema: SCHEMA_NAME 
    });
    return false;
  }
}

export default {
  admin: supabaseAdmin,
  getConnection: getSchemaAwareConnection,
  executeFHIRQuery,
  testConnection: testDatabaseConnection
};
