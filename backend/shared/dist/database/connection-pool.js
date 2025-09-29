"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseConnectionPool = exports.connectionPool = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const logger_1 = __importDefault(require("../utils/logger"));
class DatabaseConnectionPool {
    constructor(config = {}) {
        this.clients = [];
        this.activeClients = new Set();
        this.config = {
            maxConnections: config.maxConnections || 20,
            minConnections: config.minConnections || 5,
            acquireTimeoutMillis: config.acquireTimeoutMillis || 30000,
            idleTimeoutMillis: config.idleTimeoutMillis || 300000,
            healthCheckInterval: config.healthCheckInterval || 60000,
        };
        this.metrics = {
            totalConnections: 0,
            activeConnections: 0,
            idleConnections: 0,
            totalQueries: 0,
            averageQueryTime: 0,
            errorCount: 0,
        };
        this.initializePool();
        this.startHealthCheck();
    }
    initializePool() {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error("Supabase credentials not configured");
        }
        // Create minimum connections
        for (let i = 0; i < this.config.minConnections; i++) {
            const client = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                },
                db: {
                    schema: 'public',
                },
                global: {
                    headers: {
                        'x-application-name': 'hospital-management-system',
                    },
                },
            });
            this.clients.push(client);
            this.metrics.totalConnections++;
        }
        this.metrics.idleConnections = this.clients.length;
        logger_1.default.info(`Database connection pool initialized with ${this.clients.length} connections`);
    }
    startHealthCheck() {
        this.healthCheckTimer = setInterval(async () => {
            await this.performHealthCheck();
        }, this.config.healthCheckInterval);
    }
    async performHealthCheck() {
        try {
            const client = await this.acquireConnection();
            const { error } = await client.from('profiles').select('count').limit(1);
            if (error) {
                logger_1.default.warn('Database health check failed', { error: error.message });
                this.metrics.errorCount++;
            }
            this.releaseConnection(client);
        }
        catch (error) {
            logger_1.default.error('Database health check error', { error });
            this.metrics.errorCount++;
        }
    }
    async acquireConnection() {
        const startTime = Date.now();
        while (Date.now() - startTime < this.config.acquireTimeoutMillis) {
            // Find available connection
            const availableClient = this.clients.find(client => !this.activeClients.has(client));
            if (availableClient) {
                this.activeClients.add(availableClient);
                this.metrics.activeConnections = this.activeClients.size;
                this.metrics.idleConnections = this.clients.length - this.activeClients.size;
                return availableClient;
            }
            // Create new connection if under max limit
            if (this.clients.length < this.config.maxConnections) {
                const newClient = this.createNewConnection();
                this.clients.push(newClient);
                this.activeClients.add(newClient);
                this.metrics.totalConnections++;
                this.metrics.activeConnections = this.activeClients.size;
                this.metrics.idleConnections = this.clients.length - this.activeClients.size;
                return newClient;
            }
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        throw new Error('Connection pool timeout: Unable to acquire connection');
    }
    createNewConnection() {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        return (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
            db: {
                schema: 'public',
            },
            global: {
                headers: {
                    'x-application-name': 'hospital-management-system',
                },
            },
        });
    }
    releaseConnection(client) {
        this.activeClients.delete(client);
        this.metrics.activeConnections = this.activeClients.size;
        this.metrics.idleConnections = this.clients.length - this.activeClients.size;
    }
    // Public API methods
    async executeQuery(queryFn) {
        const client = await this.acquireConnection();
        const startTime = Date.now();
        try {
            const result = await queryFn(client);
            // Update metrics
            const queryTime = Date.now() - startTime;
            this.metrics.totalQueries++;
            this.metrics.averageQueryTime =
                (this.metrics.averageQueryTime * (this.metrics.totalQueries - 1) + queryTime) / this.metrics.totalQueries;
            return result;
        }
        catch (error) {
            this.metrics.errorCount++;
            logger_1.default.error('Database query error', { error, queryTime: Date.now() - startTime });
            throw error;
        }
        finally {
            this.releaseConnection(client);
        }
    }
    async executeFHIRValidation(validationFn) {
        return this.executeQuery(validationFn);
    }
    async executeDiagnosisOperation(diagnosisFn) {
        return this.executeQuery(diagnosisFn);
    }
    async executeBulkOperation(bulkFn) {
        return this.executeQuery(bulkFn);
    }
    getMetrics() {
        return { ...this.metrics };
    }
    async close() {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
        }
        // Close all connections
        this.clients.length = 0;
        this.activeClients.clear();
        this.metrics.totalConnections = 0;
        this.metrics.activeConnections = 0;
        this.metrics.idleConnections = 0;
        logger_1.default.info('Database connection pool closed');
    }
}
exports.DatabaseConnectionPool = DatabaseConnectionPool;
// Export singleton instance
exports.connectionPool = new DatabaseConnectionPool();
//# sourceMappingURL=connection-pool.js.map