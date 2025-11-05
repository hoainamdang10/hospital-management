/**
 * Prometheus Metrics for Appointments Service
 * Provides production-ready monitoring for appointment scheduling
 * 
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Production Monitoring, Observability
 */

import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

export class PrometheusMetrics {
  private registry: Registry;

  // API metrics
  public apiRequestsTotal: Counter;
  public apiRequestDuration: Histogram;
  public apiErrorsTotal: Counter;

  // Appointment metrics
  public appointmentsScheduledTotal: Counter;
  public appointmentsCancelledTotal: Counter;
  public appointmentsCompletedTotal: Counter;
  public appointmentsNoShowTotal: Counter;
  public appointmentDuration: Histogram;

  // Queue metrics
  public queueSizeGauge: Gauge;
  public queueWaitTime: Histogram;
  public patientsInQueue: Gauge;

  // Availability metrics
  public availabilityCheckDuration: Histogram;
  public slotsAvailableGauge: Gauge;

  // Conflict metrics
  public conflictsDetectedTotal: Counter;
  public conflictResolutionDuration: Histogram;

  // Database metrics
  public dbQueryDuration: Histogram;
  public dbConnectionsActive: Gauge;

  // Cache metrics
  public cacheHitRate: Gauge;

  constructor() {
    this.registry = new Registry();

    // Collect default metrics (CPU, memory, etc.)
    collectDefaultMetrics({ register: this.registry });

    // API metrics
    this.apiRequestsTotal = new Counter({
      name: 'appointments_api_requests_total',
      help: 'Total number of API requests',
      labelNames: ['method', 'endpoint', 'status_code'],
      registers: [this.registry]
    });

    this.apiRequestDuration = new Histogram({
      name: 'appointments_api_request_duration_seconds',
      help: 'Duration of API requests in seconds',
      labelNames: ['method', 'endpoint'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.registry]
    });

    this.apiErrorsTotal = new Counter({
      name: 'appointments_api_errors_total',
      help: 'Total number of API errors',
      labelNames: ['method', 'endpoint', 'error_type'],
      registers: [this.registry]
    });

    // Appointment metrics
    this.appointmentsScheduledTotal = new Counter({
      name: 'appointments_scheduled_total',
      help: 'Total number of appointments scheduled',
      labelNames: ['appointment_type', 'department'],
      registers: [this.registry]
    });

    this.appointmentsCancelledTotal = new Counter({
      name: 'appointments_cancelled_total',
      help: 'Total number of appointments cancelled',
      labelNames: ['cancellation_reason'],
      registers: [this.registry]
    });

    this.appointmentsCompletedTotal = new Counter({
      name: 'appointments_completed_total',
      help: 'Total number of appointments completed',
      labelNames: ['appointment_type'],
      registers: [this.registry]
    });

    this.appointmentsNoShowTotal = new Counter({
      name: 'appointments_no_show_total',
      help: 'Total number of no-show appointments',
      registers: [this.registry]
    });

    this.appointmentDuration = new Histogram({
      name: 'appointments_duration_minutes',
      help: 'Duration of appointments in minutes',
      labelNames: ['appointment_type'],
      buckets: [15, 30, 45, 60, 90, 120],
      registers: [this.registry]
    });

    // Queue metrics
    this.queueSizeGauge = new Gauge({
      name: 'appointments_queue_size',
      help: 'Current queue size',
      labelNames: ['doctor_id', 'department'],
      registers: [this.registry]
    });

    this.queueWaitTime = new Histogram({
      name: 'appointments_queue_wait_time_minutes',
      help: 'Queue wait time in minutes',
      buckets: [5, 10, 15, 30, 60, 120],
      registers: [this.registry]
    });

    this.patientsInQueue = new Gauge({
      name: 'appointments_patients_in_queue',
      help: 'Number of patients currently in queue',
      labelNames: ['priority'],
      registers: [this.registry]
    });

    // Availability metrics
    this.availabilityCheckDuration = new Histogram({
      name: 'appointments_availability_check_duration_seconds',
      help: 'Duration of availability checks',
      buckets: [0.01, 0.05, 0.1, 0.5, 1],
      registers: [this.registry]
    });

    this.slotsAvailableGauge = new Gauge({
      name: 'appointments_slots_available',
      help: 'Number of available appointment slots',
      labelNames: ['doctor_id', 'date'],
      registers: [this.registry]
    });

    // Conflict metrics
    this.conflictsDetectedTotal = new Counter({
      name: 'appointments_conflicts_detected_total',
      help: 'Total number of scheduling conflicts detected',
      registers: [this.registry]
    });

    this.conflictResolutionDuration = new Histogram({
      name: 'appointments_conflict_resolution_duration_seconds',
      help: 'Duration of conflict resolution',
      buckets: [0.1, 0.5, 1, 2, 5],
      registers: [this.registry]
    });

    // Database metrics
    this.dbQueryDuration = new Histogram({
      name: 'appointments_db_query_duration_seconds',
      help: 'Duration of database queries',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
      registers: [this.registry]
    });

    this.dbConnectionsActive = new Gauge({
      name: 'appointments_db_connections_active',
      help: 'Number of active database connections',
      registers: [this.registry]
    });

    // Cache metrics
    this.cacheHitRate = new Gauge({
      name: 'appointments_cache_hit_rate',
      help: 'Cache hit rate (0-1)',
      labelNames: ['cache_type'],
      registers: [this.registry]
    });
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getRegistry(): Registry {
    return this.registry;
  }

  reset(): void {
    this.registry.resetMetrics();
  }
}

// Singleton instance
export const prometheusMetrics = new PrometheusMetrics();

