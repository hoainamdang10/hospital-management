"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbPool = exports.supabaseAdmin = void 0;
exports.getSupabase = getSupabase;
exports.testDatabaseConnection = testDatabaseConnection;
exports.getSchemaAwareConnection = getSchemaAwareConnection;
exports.executeFHIRQuery = executeFHIRQuery;
const schema_mapping_1 = require("@hospital/shared/dist/config/schema-mapping");
const schema_aware_connection_pool_1 = require("@hospital/shared/dist/database/schema-aware-connection-pool");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const supabase_js_1 = require("@supabase/supabase-js");
// Service configuration
const SERVICE_NAME = "medical-records-service";
const SCHEMA_NAME = (0, schema_mapping_1.getSchemaForService)(SERVICE_NAME);
// Environment variables validation
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl) {
    throw new Error("SUPABASE_URL environment variable is required");
}
if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required");
}
logger_1.default.info("Database configuration loaded for Medical Records Service", {
    service: "medical-records-service",
    url: supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
    connectionPooling: true,
});
// Connection Pool Integration - Use schema-aware pool via helper wrappers
// Legacy direct client for backward compatibility (deprecated - use connectionPool instead)
exports.supabaseAdmin = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
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
});
// Legacy function for backward compatibility (deprecated)
function getSupabase() {
    return exports.supabaseAdmin;
}
// New recommended database access methods using schema-aware connection pooling
const pool = (0, schema_aware_connection_pool_1.getConnectionPool)();
exports.dbPool = {
    async executeQuery(queryFn) {
        const client = await pool.getConnection(SERVICE_NAME);
        return queryFn(client);
    },
    async executeFHIRValidation(validationFn) {
        return pool.executeFHIRValidation(SERVICE_NAME, validationFn);
    },
    async executeDiagnosisOperation(diagnosisFn) {
        const client = await pool.getConnection(SERVICE_NAME);
        return diagnosisFn(client);
    },
    async executeBulkOperation(bulkFn) {
        const client = await pool.getConnection(SERVICE_NAME);
        return bulkFn(client);
    },
};
// Test database connection
async function testDatabaseConnection() {
    try {
        const { data, error } = await exports.supabaseAdmin
            .from("medical_records")
            .select("count(*)", { count: "exact", head: true });
        if (error) {
            logger_1.default.error("Database connection test failed", { error });
            return false;
        }
        logger_1.default.info("Database connection test successful", {
            service: "medical-records-service",
        });
        return true;
    }
    catch (error) {
        logger_1.default.error("Database connection test exception", { error });
        return false;
    }
}
/**
 * Get a schema-aware connection from the pool
 */
async function getSchemaAwareConnection() {
    const connectionPool = (0, schema_aware_connection_pool_1.getConnectionPool)();
    return connectionPool.getConnection(SERVICE_NAME);
}
/**
 * Execute query with FHIR validation for healthcare compliance
 */
async function executeFHIRQuery(queryFn) {
    const connectionPool = (0, schema_aware_connection_pool_1.getConnectionPool)();
    return connectionPool.executeFHIRValidation(SERVICE_NAME, queryFn);
}
//# sourceMappingURL=database.config.js.map