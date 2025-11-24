"use strict";
/**
 * Prometheus Metrics for Appointments Service
 * Provides production-ready monitoring for appointment scheduling
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Production Monitoring, Observability
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.prometheusMetrics = exports.PrometheusMetrics = void 0;
const prom_client_1 = require("prom-client");
class PrometheusMetrics {
    constructor() {
        this.registry = new prom_client_1.Registry();
        // Collect default metrics (CPU, memory, etc.)
        (0, prom_client_1.collectDefaultMetrics)({ register: this.registry });
        // API metrics
        this.apiRequestsTotal = new prom_client_1.Counter({
            name: 'appointments_api_requests_total',
            help: 'Total number of API requests',
            labelNames: ['method', 'endpoint', 'status_code'],
            registers: [this.registry]
        });
        this.apiRequestDuration = new prom_client_1.Histogram({
            name: 'appointments_api_request_duration_seconds',
            help: 'Duration of API requests in seconds',
            labelNames: ['method', 'endpoint'],
            buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
            registers: [this.registry]
        });
        this.apiErrorsTotal = new prom_client_1.Counter({
            name: 'appointments_api_errors_total',
            help: 'Total number of API errors',
            labelNames: ['method', 'endpoint', 'error_type'],
            registers: [this.registry]
        });
        // Appointment metrics
        this.appointmentsScheduledTotal = new prom_client_1.Counter({
            name: 'appointments_scheduled_total',
            help: 'Total number of appointments scheduled',
            labelNames: ['appointment_type', 'department'],
            registers: [this.registry]
        });
        this.appointmentsCancelledTotal = new prom_client_1.Counter({
            name: 'appointments_cancelled_total',
            help: 'Total number of appointments cancelled',
            labelNames: ['cancellation_reason'],
            registers: [this.registry]
        });
        this.appointmentsCompletedTotal = new prom_client_1.Counter({
            name: 'appointments_completed_total',
            help: 'Total number of appointments completed',
            labelNames: ['appointment_type'],
            registers: [this.registry]
        });
        this.appointmentsNoShowTotal = new prom_client_1.Counter({
            name: 'appointments_no_show_total',
            help: 'Total number of no-show appointments',
            registers: [this.registry]
        });
        this.appointmentDuration = new prom_client_1.Histogram({
            name: 'appointments_duration_minutes',
            help: 'Duration of appointments in minutes',
            labelNames: ['appointment_type'],
            buckets: [15, 30, 45, 60, 90, 120],
            registers: [this.registry]
        });
        // Queue metrics
        this.queueSizeGauge = new prom_client_1.Gauge({
            name: 'appointments_queue_size',
            help: 'Current queue size',
            labelNames: ['doctor_id', 'department'],
            registers: [this.registry]
        });
        this.queueWaitTime = new prom_client_1.Histogram({
            name: 'appointments_queue_wait_time_minutes',
            help: 'Queue wait time in minutes',
            buckets: [5, 10, 15, 30, 60, 120],
            registers: [this.registry]
        });
        this.patientsInQueue = new prom_client_1.Gauge({
            name: 'appointments_patients_in_queue',
            help: 'Number of patients currently in queue',
            labelNames: ['priority'],
            registers: [this.registry]
        });
        // Availability metrics
        this.availabilityCheckDuration = new prom_client_1.Histogram({
            name: 'appointments_availability_check_duration_seconds',
            help: 'Duration of availability checks',
            buckets: [0.01, 0.05, 0.1, 0.5, 1],
            registers: [this.registry]
        });
        this.slotsAvailableGauge = new prom_client_1.Gauge({
            name: 'appointments_slots_available',
            help: 'Number of available appointment slots',
            labelNames: ['doctor_id', 'date'],
            registers: [this.registry]
        });
        // Conflict metrics
        this.conflictsDetectedTotal = new prom_client_1.Counter({
            name: 'appointments_conflicts_detected_total',
            help: 'Total number of scheduling conflicts detected',
            registers: [this.registry]
        });
        this.conflictResolutionDuration = new prom_client_1.Histogram({
            name: 'appointments_conflict_resolution_duration_seconds',
            help: 'Duration of conflict resolution',
            buckets: [0.1, 0.5, 1, 2, 5],
            registers: [this.registry]
        });
        // Database metrics
        this.dbQueryDuration = new prom_client_1.Histogram({
            name: 'appointments_db_query_duration_seconds',
            help: 'Duration of database queries',
            labelNames: ['operation', 'table'],
            buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
            registers: [this.registry]
        });
        this.dbConnectionsActive = new prom_client_1.Gauge({
            name: 'appointments_db_connections_active',
            help: 'Number of active database connections',
            registers: [this.registry]
        });
        // Cache metrics
        this.cacheHitRate = new prom_client_1.Gauge({
            name: 'appointments_cache_hit_rate',
            help: 'Cache hit rate (0-1)',
            labelNames: ['cache_type'],
            registers: [this.registry]
        });
    }
    async getMetrics() {
        return this.registry.metrics();
    }
    getRegistry() {
        return this.registry;
    }
    reset() {
        this.registry.resetMetrics();
    }
}
exports.PrometheusMetrics = PrometheusMetrics;
// Singleton instance
exports.prometheusMetrics = new PrometheusMetrics();
//# sourceMappingURL=PrometheusMetrics.js.map