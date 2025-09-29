"use strict";
/**
 * Schema-Aware Connection Pool for Hospital Management System
 * Provides database connections with proper schema isolation
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance HIPAA, Microservices Architecture
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaAwareConnectionPool = void 0;
exports.getConnectionPool = getConnectionPool;
exports.initializeConnectionPool = initializeConnectionPool;
const supabase_js_1 = require("@supabase/supabase-js");
const schema_mapping_1 = require("../config/schema-mapping");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Schema-aware connection pool that ensures proper service isolation
 */
class SchemaAwareConnectionPool {
    constructor(config) {
        this.connections = new Map();
        this.isInitialized = false;
        this.config = config;
        this.metrics = {
            totalConnections: 0,
            activeConnections: 0,
            idleConnections: 0,
            totalQueries: 0,
            averageResponseTime: 0,
            errorCount: 0,
            schemaViolations: 0,
        };
    }
    /**
     * Initialize the connection pool
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        logger_1.default.info("🔄 Initializing Schema-Aware Connection Pool...");
        try {
            // Pre-create minimum connections for each schema
            const schemas = [
                "auth_schema",
                "doctor_schema",
                "patient_schema",
                "appointment_schema",
                "medical_records_schema",
                "payment_schema",
                "file_schema",
            ];
            for (const schema of schemas) {
                await this.createSchemaConnections(schema, this.config.minConnections);
            }
            this.isInitialized = true;
            logger_1.default.info("✅ Schema-Aware Connection Pool initialized successfully");
        }
        catch (error) {
            logger_1.default.error("❌ Failed to initialize connection pool:", error);
            throw error;
        }
    }
    /**
     * Get a connection for a specific service
     */
    async getConnection(serviceName) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        const schemaName = (0, schema_mapping_1.getSchemaForService)(serviceName);
        const connectionKey = `${serviceName}:${schemaName}`;
        let connections = this.connections.get(connectionKey) || [];
        // Find an idle connection
        let connection = connections.find((conn) => Date.now() - conn.lastUsed.getTime() > 1000 // 1 second idle
        );
        if (!connection) {
            // Create new connection if under max limit
            if (connections.length < this.config.maxConnections) {
                connection = await this.createConnection(serviceName, schemaName);
                connections.push(connection);
                this.connections.set(connectionKey, connections);
            }
            else {
                // Wait for available connection or use least recently used
                connection = connections.reduce((oldest, current) => current.lastUsed < oldest.lastUsed ? current : oldest);
            }
        }
        // Update connection usage
        connection.lastUsed = new Date();
        connection.queryCount++;
        this.metrics.activeConnections++;
        return this.createProxyClient(connection, serviceName);
    }
    /**
     * Create a new connection for specific schema
     */
    async createConnection(serviceName, schemaName) {
        try {
            const client = (0, supabase_js_1.createClient)(this.config.supabaseUrl, this.config.supabaseServiceKey, {
                db: {
                    schema: schemaName,
                },
                auth: {
                    persistSession: false,
                },
                global: {
                    headers: {
                        "X-Service-Name": serviceName,
                        "X-Schema-Name": schemaName,
                        "X-Connection-Pool": "schema-aware-v2",
                    },
                },
            });
            const connection = {
                client,
                schemaName,
                serviceName,
                createdAt: new Date(),
                lastUsed: new Date(),
                queryCount: 0,
            };
            this.metrics.totalConnections++;
            logger_1.default.debug(`✅ Created new connection for ${serviceName} -> ${schemaName}`);
            return connection;
        }
        catch (error) {
            logger_1.default.error(`❌ Failed to create connection for ${serviceName}:`, error);
            throw error;
        }
    }
    /**
     * Create multiple connections for a schema
     */
    async createSchemaConnections(schemaName, count) {
        const serviceName = this.getServiceNameForSchema(schemaName);
        const connections = [];
        for (let i = 0; i < count; i++) {
            const connection = await this.createConnection(serviceName, schemaName);
            connections.push(connection);
        }
        const connectionKey = `${serviceName}:${schemaName}`;
        this.connections.set(connectionKey, connections);
    }
    /**
     * Create a proxy client with validation
     */
    createProxyClient(connection, serviceName) {
        const originalClient = connection.client;
        // Create proxy to intercept and validate queries
        return new Proxy(originalClient, {
            get: (target, prop) => {
                if (prop === "from") {
                    return (tableName) => {
                        // Validate table access
                        if (!(0, schema_mapping_1.validateTableAccess)(serviceName, tableName)) {
                            this.metrics.schemaViolations++;
                            const error = new Error(`❌ Schema violation: Service '${serviceName}' không được phép truy cập bảng '${tableName}'`);
                            logger_1.default.error("🚨 Schema Access Violation:", {
                                serviceName,
                                tableName,
                                schemaName: connection.schemaName,
                                timestamp: new Date().toISOString(),
                            });
                            throw error;
                        }
                        // Log successful access for audit
                        logger_1.default.debug("✅ Schema access granted:", {
                            serviceName,
                            tableName,
                            schemaName: connection.schemaName,
                        });
                        return target.from(tableName);
                    };
                }
                return target[prop];
            },
        });
    }
    /**
     * Execute query with FHIR validation (for healthcare compliance)
     */
    async executeFHIRValidation(serviceName, queryFn) {
        if (!this.config.enableFHIRValidation) {
            const client = await this.getConnection(serviceName);
            return queryFn(client);
        }
        const startTime = Date.now();
        const client = await this.getConnection(serviceName);
        try {
            // Add FHIR validation headers
            const result = await queryFn(client);
            // Log for HIPAA compliance
            const responseTime = Date.now() - startTime;
            this.updateMetrics(responseTime, false);
            logger_1.default.info("🏥 FHIR-compliant query executed:", {
                serviceName,
                responseTime,
                timestamp: new Date().toISOString(),
            });
            return result;
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            this.updateMetrics(responseTime, true);
            logger_1.default.error("❌ FHIR query failed:", {
                serviceName,
                error: error?.message || "Unknown error",
                responseTime,
            });
            throw error;
        }
        finally {
            this.metrics.activeConnections--;
        }
    }
    /**
     * Get service name for schema (reverse lookup)
     */
    getServiceNameForSchema(schemaName) {
        const mapping = {
            auth_schema: "auth-service",
            doctor_schema: "doctor-service",
            patient_schema: "patient-service",
            appointment_schema: "appointment-service",
            medical_records_schema: "medical-records-service",
            payment_schema: "payment-service",
            file_schema: "file-service",
        };
        return mapping[schemaName] || "unknown-service";
    }
    /**
     * Update connection metrics
     */
    updateMetrics(responseTime, hasError) {
        this.metrics.totalQueries++;
        if (hasError) {
            this.metrics.errorCount++;
        }
        // Update average response time
        this.metrics.averageResponseTime =
            (this.metrics.averageResponseTime * (this.metrics.totalQueries - 1) +
                responseTime) /
                this.metrics.totalQueries;
    }
    /**
     * Get current pool metrics
     */
    getMetrics() {
        // Update idle connections count
        let totalIdle = 0;
        for (const connections of this.connections.values()) {
            totalIdle += connections.filter((conn) => Date.now() - conn.lastUsed.getTime() > this.config.idleTimeoutMillis).length;
        }
        this.metrics.idleConnections = totalIdle;
        return { ...this.metrics };
    }
    /**
     * Health check for the connection pool
     */
    async healthCheck() {
        try {
            const metrics = this.getMetrics();
            const status = metrics.errorCount / Math.max(metrics.totalQueries, 1) < 0.1
                ? "healthy"
                : "degraded";
            return {
                status,
                metrics,
                details: {
                    initialized: this.isInitialized,
                    totalSchemas: this.connections.size,
                    config: {
                        maxConnections: this.config.maxConnections,
                        minConnections: this.config.minConnections,
                    },
                },
            };
        }
        catch (error) {
            return {
                status: "unhealthy",
                metrics: this.metrics,
                details: { error: error?.message || "Unknown error" },
            };
        }
    }
    /**
     * Graceful shutdown
     */
    async shutdown() {
        logger_1.default.info("🔄 Shutting down Schema-Aware Connection Pool...");
        // Clear all connections
        this.connections.clear();
        this.isInitialized = false;
        logger_1.default.info("✅ Connection pool shutdown complete");
    }
}
exports.SchemaAwareConnectionPool = SchemaAwareConnectionPool;
// Singleton instance
let poolInstance = null;
/**
 * Get or create the connection pool instance
 */
function getConnectionPool() {
    if (!poolInstance) {
        const config = {
            supabaseUrl: process.env.SUPABASE_URL,
            supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
            maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || "20"),
            minConnections: parseInt(process.env.DB_MIN_CONNECTIONS || "5"),
            acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT || "30000"),
            idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || "300000"),
            enableMetrics: process.env.DB_ENABLE_METRICS === "true",
            enableFHIRValidation: process.env.ENABLE_FHIR_VALIDATION === "true",
        };
        poolInstance = new SchemaAwareConnectionPool(config);
    }
    return poolInstance;
}
/**
 * Initialize the global connection pool
 */
async function initializeConnectionPool() {
    const pool = getConnectionPool();
    await pool.initialize();
}
exports.default = getConnectionPool;
//# sourceMappingURL=schema-aware-connection-pool.js.map