import { connectionPool } from "@hospital/shared/dist/database/connection-pool";
import logger from "@hospital/shared/dist/utils/logger";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL environment variable is required");
}

if (!supabaseServiceKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required");
}

logger.info("Database configuration loaded for GraphQL Gateway", {
  service: "graphql-gateway",
  url: supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  connectionPooling: true,
});

// Connection Pool Integration - Primary method for database operations
export { connectionPool };

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
      schema: "public",
    },
    global: {
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        "X-Client-Info": `graphql-gateway-${Date.now()}`,
      },
    },
  }
);

// Legacy function for backward compatibility (deprecated)
export function getSupabase(): SupabaseClient {
  return supabaseAdmin;
}

// New recommended database access methods using connection pooling
export const dbPool = {
  // Execute standard query with connection pooling
  async executeQuery<T>(queryFn: (client: any) => Promise<T>): Promise<T> {
    return connectionPool.executeQuery(queryFn);
  },

  // Execute healthcare-specific FHIR validation
  async executeFHIRValidation<T>(
    validationFn: (client: any) => Promise<T>
  ): Promise<T> {
    return connectionPool.executeFHIRValidation(validationFn);
  },

  // Execute diagnosis operations with high priority
  async executeDiagnosisOperation<T>(
    diagnosisFn: (client: any) => Promise<T>
  ): Promise<T> {
    return connectionPool.executeDiagnosisOperation(diagnosisFn);
  },

  // Execute bulk operations with low priority
  async executeBulkOperation<T>(
    bulkFn: (client: any) => Promise<T>
  ): Promise<T> {
    return connectionPool.executeBulkOperation(bulkFn);
  },
};

export default getSupabase;
