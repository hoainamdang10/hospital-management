/**
 * Prometheus Metrics for Provider/Staff Service
 * Provides production-ready monitoring for healthcare staff management
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production Monitoring, Observability
 */

import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

export class PrometheusMetrics {
  private registry: Registry;

  // API metrics
  public apiRequestsTotal: Counter;
  public apiRequestDuration: Histogram;
  public apiErrorsTotal: Counter;

  // Staff metrics
  public staffRegisteredTotal: Counter;
  public staffSearchDuration: Histogram;
  public activeStaffCount: Gauge;
  public staffByDepartment: Gauge;

  // Credential metrics
  public credentialsAddedTotal: Counter;
  public credentialsExpiringCount: Gauge;
  public credentialValidationDuration: Histogram;

  // Schedule metrics
  public scheduleUpdatesTotal: Counter;
  public scheduleConflictsDetected: Counter;

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
      name: 'provider_staff_api_requests_total',
      help: 'Total number of API requests',
      labelNames: ['method', 'endpoint', 'status_code'],
      registers: [this.registry]
    });

    this.apiRequestDuration = new Histogram({
      name: 'provider_staff_api_request_duration_seconds',
      help: 'Duration of API requests in seconds',
      labelNames: ['method', 'endpoint'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.registry]
    });

    this.apiErrorsTotal = new Counter({
      name: 'provider_staff_api_errors_total',
      help: 'Total number of API errors',
      labelNames: ['method', 'endpoint', 'error_type'],
      registers: [this.registry]
    });

    // Staff metrics
    this.staffRegisteredTotal = new Counter({
      name: 'provider_staff_registered_total',
      help: 'Total number of staff registered',
      labelNames: ['staff_type', 'department'],
      registers: [this.registry]
    });

    this.staffSearchDuration = new Histogram({
      name: 'provider_staff_search_duration_seconds',
      help: 'Duration of staff search operations',
      labelNames: ['search_type'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.registry]
    });

    this.activeStaffCount = new Gauge({
      name: 'provider_staff_active_count',
      help: 'Number of active staff members',
      labelNames: ['staff_type'],
      registers: [this.registry]
    });

    this.staffByDepartment = new Gauge({
      name: 'provider_staff_by_department',
      help: 'Number of staff members by department',
      labelNames: ['department_id'],
      registers: [this.registry]
    });

    // Credential metrics
    this.credentialsAddedTotal = new Counter({
      name: 'provider_staff_credentials_added_total',
      help: 'Total number of credentials added',
      labelNames: ['credential_type'],
      registers: [this.registry]
    });

    this.credentialsExpiringCount = new Gauge({
      name: 'provider_staff_credentials_expiring_count',
      help: 'Number of credentials expiring soon',
      labelNames: ['days_until_expiry'],
      registers: [this.registry]
    });

    this.credentialValidationDuration = new Histogram({
      name: 'provider_staff_credential_validation_duration_seconds',
      help: 'Duration of credential validation operations',
      buckets: [0.01, 0.05, 0.1, 0.5, 1],
      registers: [this.registry]
    });

    // Schedule metrics
    this.scheduleUpdatesTotal = new Counter({
      name: 'provider_staff_schedule_updates_total',
      help: 'Total number of schedule updates',
      labelNames: ['update_type'],
      registers: [this.registry]
    });

    this.scheduleConflictsDetected = new Counter({
      name: 'provider_staff_schedule_conflicts_detected_total',
      help: 'Total number of schedule conflicts detected',
      registers: [this.registry]
    });

    // Database metrics
    this.dbQueryDuration = new Histogram({
      name: 'provider_staff_db_query_duration_seconds',
      help: 'Duration of database queries',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
      registers: [this.registry]
    });

    this.dbConnectionsActive = new Gauge({
      name: 'provider_staff_db_connections_active',
      help: 'Number of active database connections',
      registers: [this.registry]
    });

    // Cache metrics
    this.cacheHitRate = new Gauge({
      name: 'provider_staff_cache_hit_rate',
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

