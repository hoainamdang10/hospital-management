"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbPool = exports.supabase = exports.supabaseAdmin = void 0;
exports.getSupabase = getSupabase;
exports.testDatabaseConnection = testDatabaseConnection;
exports.getSchemaAwareConnection = getSchemaAwareConnection;
exports.executeFHIRQuery = executeFHIRQuery;
const schema_mapping_1 = require("@hospital/shared/dist/config/schema-mapping");
const schema_aware_connection_pool_1 = require("@hospital/shared/dist/database/schema-aware-connection-pool");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const supabase_js_1 = require("@supabase/supabase-js");
const SERVICE_NAME = "receptionist-service";
const SCHEMA_NAME = (0, schema_mapping_1.getSchemaForService)(SERVICE_NAME);
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl) {
    throw new Error("SUPABASE_URL environment variable is required");
}
if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required");
}
logger_1.default.info("Database configuration loaded for Receptionist Service", {
    service: "receptionist-service",
    url: supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
    connectionPooling: true,
});
exports.supabaseAdmin = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
    db: {
        schema: SCHEMA_NAME,
    },
    global: {
        headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
            "X-Client-Info": `receptionist-service-${Date.now()}`,
        },
    },
});
exports.supabase = exports.supabaseAdmin;
function getSupabase() {
    return exports.supabaseAdmin;
}
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
async function testDatabaseConnection() {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from("receptionist")
            .select("*")
            .limit(1);
        if (error) {
            logger_1.default.error("Database connection test failed", { error });
            return false;
        }
        logger_1.default.info("Database connection test successful", {
            service: "receptionist-service",
        });
        return true;
    }
    catch (error) {
        logger_1.default.error("Database connection test failed", { error });
        return false;
    }
}
async function getSchemaAwareConnection() {
    const connectionPool = (0, schema_aware_connection_pool_1.getConnectionPool)();
    return connectionPool.getConnection(SERVICE_NAME);
}
async function executeFHIRQuery(queryFn) {
    const connectionPool = (0, schema_aware_connection_pool_1.getConnectionPool)();
    return connectionPool.executeFHIRValidation(SERVICE_NAME, queryFn);
}
//# sourceMappingURL=database.config.js.map