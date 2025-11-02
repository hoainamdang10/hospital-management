"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsCollector = void 0;
const prom_client_1 = require("prom-client");
class MetricsCollector {
    constructor() {
        this.registry = new prom_client_1.Registry();
        // Worker Metrics
        this.workerPollDuration = new prom_client_1.Histogram({
            name: 'scheduler_worker_poll_duration_seconds',
            help: 'Duration of worker poll operations',
            labelNames: ['worker_id', 'segment'],
            buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
            registers: [this.registry]
        });
        this.workerRunsExecuted = new prom_client_1.Counter({
            name: 'scheduler_worker_runs_executed_total',
            help: 'Total number of runs executed by workers',
            labelNames: ['worker_id', 'status'],
            registers: [this.registry]
        });
        this.workerRunsFailed = new prom_client_1.Counter({
            name: 'scheduler_worker_runs_failed_total',
            help: 'Total number of runs failed',
            labelNames: ['worker_id', 'error_type'],
            registers: [this.registry]
        });
        this.workerActiveRuns = new prom_client_1.Gauge({
            name: 'scheduler_worker_active_runs',
            help: 'Number of currently active runs',
            labelNames: ['worker_id'],
            registers: [this.registry]
        });
        this.workerCleanupOperations = new prom_client_1.Counter({
            name: 'scheduler_worker_cleanup_operations_total',
            help: 'Total number of cleanup operations',
            labelNames: ['operation_type'],
            registers: [this.registry]
        });
        this.workerCleanupDuration = new prom_client_1.Histogram({
            name: 'scheduler_worker_cleanup_duration_seconds',
            help: 'Duration of cleanup operations',
            labelNames: ['operation_type'],
            buckets: [0.1, 0.5, 1, 5, 10, 30, 60],
            registers: [this.registry]
        });
        this.workerMaterializationDuration = new prom_client_1.Histogram({
            name: 'scheduler_worker_materialization_duration_seconds',
            help: 'Duration of materialization operations',
            buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
            registers: [this.registry]
        });
        this.workerMaterializationRuns = new prom_client_1.Counter({
            name: 'scheduler_worker_materialization_runs_total',
            help: 'Total number of runs materialized',
            labelNames: ['schedule_type'],
            registers: [this.registry]
        });
        // API Metrics
        this.apiRequestDuration = new prom_client_1.Histogram({
            name: 'scheduler_api_request_duration_seconds',
            help: 'Duration of API requests',
            labelNames: ['method', 'route', 'status_code'],
            buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
            registers: [this.registry]
        });
        this.apiRequestTotal = new prom_client_1.Counter({
            name: 'scheduler_api_request_total',
            help: 'Total number of API requests',
            labelNames: ['method', 'route', 'status_code'],
            registers: [this.registry]
        });
        this.apiRequestErrors = new prom_client_1.Counter({
            name: 'scheduler_api_request_errors_total',
            help: 'Total number of API request errors',
            labelNames: ['method', 'route', 'error_type'],
            registers: [this.registry]
        });
        // Database Metrics
        this.dbQueryDuration = new prom_client_1.Histogram({
            name: 'scheduler_db_query_duration_seconds',
            help: 'Duration of database queries',
            labelNames: ['operation', 'table'],
            buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
            registers: [this.registry]
        });
        this.dbQueryTotal = new prom_client_1.Counter({
            name: 'scheduler_db_query_total',
            help: 'Total number of database queries',
            labelNames: ['operation', 'table'],
            registers: [this.registry]
        });
        this.dbQueryErrors = new prom_client_1.Counter({
            name: 'scheduler_db_query_errors_total',
            help: 'Total number of database query errors',
            labelNames: ['operation', 'table', 'error_type'],
            registers: [this.registry]
        });
        this.dbConnectionPoolSize = new prom_client_1.Gauge({
            name: 'scheduler_db_connection_pool_size',
            help: 'Current database connection pool size',
            registers: [this.registry]
        });
        // Business Metrics
        this.schedulesActive = new prom_client_1.Gauge({
            name: 'scheduler_schedules_active',
            help: 'Number of active schedules',
            labelNames: ['tenant_id', 'schedule_type'],
            registers: [this.registry]
        });
        this.schedulesTotal = new prom_client_1.Counter({
            name: 'scheduler_schedules_total',
            help: 'Total number of schedules created',
            labelNames: ['tenant_id', 'schedule_type'],
            registers: [this.registry]
        });
        this.runsPending = new prom_client_1.Gauge({
            name: 'scheduler_runs_pending',
            help: 'Number of pending runs',
            labelNames: ['tenant_id'],
            registers: [this.registry]
        });
        this.runsCompleted = new prom_client_1.Counter({
            name: 'scheduler_runs_completed_total',
            help: 'Total number of completed runs',
            labelNames: ['tenant_id', 'status'],
            registers: [this.registry]
        });
        this.runsFailed = new prom_client_1.Counter({
            name: 'scheduler_runs_failed_total',
            help: 'Total number of failed runs',
            labelNames: ['tenant_id', 'error_type'],
            registers: [this.registry]
        });
        // Unroutable Messages Metrics
        this.unroutableMessagesTotal = new prom_client_1.Counter({
            name: 'scheduler_unroutable_messages_total',
            help: 'Total number of unroutable messages',
            labelNames: ['routing_key', 'exchange'],
            registers: [this.registry]
        });
        this.unroutableMessagesByExchange = new prom_client_1.Counter({
            name: 'scheduler_unroutable_messages_by_exchange_total',
            help: 'Total number of unroutable messages grouped by exchange',
            labelNames: ['exchange'],
            registers: [this.registry]
        });
        // Register default metrics (CPU, memory, etc.)
        this.registry.setDefaultLabels({
            app: 'scheduler-service',
            version: '1.0.0'
        });
    }
    static getInstance() {
        if (!MetricsCollector.instance) {
            MetricsCollector.instance = new MetricsCollector();
        }
        return MetricsCollector.instance;
    }
    getRegistry() {
        return this.registry;
    }
    async getMetrics() {
        return this.registry.metrics();
    }
    reset() {
        this.registry.resetMetrics();
    }
}
exports.MetricsCollector = MetricsCollector;
//# sourceMappingURL=MetricsCollector.js.map