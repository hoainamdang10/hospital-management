"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbPool = exports.initializeSupabase = exports.testSupabaseConnection = exports.supabaseClient = exports.supabaseFresh = exports.supabaseAdmin = void 0;
exports.getSchemaAwareConnection = getSchemaAwareConnection;
exports.executeFHIRQuery = executeFHIRQuery;
const schema_aware_connection_pool_1 = require("@hospital/shared/dist/database/schema-aware-connection-pool");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const schema_mapping_1 = require("@hospital/shared/dist/config/schema-mapping");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const supabase_js_1 = require("@supabase/supabase-js");
const SERVICE_NAME = "auth-service";
const SCHEMA_NAME = (0, schema_mapping_1.getSchemaForService)(SERVICE_NAME);
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl) {
    throw new Error("SUPABASE_URL environment variable is required");
}
if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required");
}
if (!supabaseAnonKey) {
    throw new Error("SUPABASE_ANON_KEY environment variable is required");
}
logger_1.default.info("Database configuration loaded for Auth Service", {
    service: "auth-service",
    url: supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
    hasAnonKey: !!supabaseAnonKey,
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
            "X-Client-Info": `auth-service-${Date.now()}`,
        },
    },
});
exports.supabaseFresh = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
    db: {
        schema: SCHEMA_NAME,
    },
    global: {
        headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
            "X-Client-Info": `fresh-client-${Date.now()}`,
        },
    },
});
exports.supabaseClient = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
    },
    db: {
        schema: SCHEMA_NAME,
    },
});
const testSupabaseConnection = async () => {
    try {
        logger_1.default.info("🔍 Testing Supabase connection...");
        const schemaClient = await getSchemaAwareConnection();
        const { data: adminTest, error: adminError } = await schemaClient
            .from("profiles")
            .select("count")
            .limit(1);
        if (adminError) {
            logger_1.default.error("❌ Supabase schema-aware client connection failed:", {
                error: adminError.message,
                code: adminError.code,
                details: adminError.details,
                schema: SCHEMA_NAME,
            });
            return false;
        }
        logger_1.default.info("✅ Supabase schema-aware connection test successful", {
            schema: SCHEMA_NAME,
            profilesAccessible: true,
        });
        return true;
    }
    catch (error) {
        logger_1.default.error("❌ Supabase connection test error:", {
            error: error.message,
            stack: error.stack,
        });
        return false;
    }
};
exports.testSupabaseConnection = testSupabaseConnection;
const initializeSupabase = async () => {
    logger_1.default.info("🚀 Initializing Supabase connection...");
    const isConnected = await (0, exports.testSupabaseConnection)();
    if (!isConnected) {
        logger_1.default.error("❌ Failed to connect to Supabase. Please check your configuration.");
        logger_1.default.warn("⚠️ Starting Auth Service in degraded mode (Supabase unavailable)");
        return;
    }
    logger_1.default.info("✅ Supabase initialized successfully");
};
exports.initializeSupabase = initializeSupabase;
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
exports.default = {
    admin: exports.supabaseAdmin,
    client: exports.supabaseClient,
    testConnection: exports.testSupabaseConnection,
    dbPool: exports.dbPool,
};
async function getSchemaAwareConnection() {
    const connectionPool = (0, schema_aware_connection_pool_1.getConnectionPool)();
    return connectionPool.getConnection(SERVICE_NAME);
}
async function executeFHIRQuery(queryFn) {
    const connectionPool = (0, schema_aware_connection_pool_1.getConnectionPool)();
    return connectionPool.executeFHIRValidation(SERVICE_NAME, queryFn);
}
//# sourceMappingURL=supabase.js.map